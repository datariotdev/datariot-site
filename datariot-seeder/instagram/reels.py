#!/usr/bin/env python3
"""Discover authorised-account Reels and publish reviewed local MP4s. Stdlib only."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parent
MAX_BYTES = 100 * 1024 * 1024
CATEGORIES = {"Engineering", "Education", "AI", "Logic"}


def canonical_url(value):
    parsed = urllib.parse.urlsplit(value)
    if (parsed.scheme != "https" or parsed.netloc not in {"instagram.com", "www.instagram.com"}
            or not re.fullmatch(r"/reels?/[A-Za-z0-9_-]+/?", parsed.path)):
        raise ValueError("Expected a public https://www.instagram.com/reel/<code>/ URL")
    code = parsed.path.strip("/").split("/")[1]
    return f"https://www.instagram.com/reel/{code}/"


def video_id(item):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, "datariot:instagram:" + canonical_url(item["source_url"])))


def request(url, token, *, method="GET", data=None, headers=None):
    # Never print URLs, response bodies or exceptions containing credential material.
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": "Bearer " + token, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"API request failed (HTTP {error.code}); check permissions and configuration") from None
    except urllib.error.URLError:
        raise RuntimeError("API connection failed") from None


def load_manifest(path):
    data = json.loads(path.read_text())
    if data.get("schema_version") != 1 or not isinstance(data.get("items"), list):
        raise ValueError("Expected schema_version 1 and an items array")
    seen = set()
    for item in data["items"]:
        if not isinstance(item, dict) or not isinstance(item.get("source_url"), str):
            raise ValueError("Each candidate needs a source_url string")
        url = canonical_url(item["source_url"])
        if url in seen:
            raise ValueError("Duplicate source URL in manifest")
        seen.add(url)
    return data["items"]


def queue_sql(items):
    """Export repeatable queue inserts for the connected SQL tool; preserve existing reviews."""
    payload = json.dumps(items, ensure_ascii=False)
    tag = "$datariot_candidates$"
    while tag in payload:
        tag = tag[:-1] + "_$"
    return ("with inserted as (\n"
            "  insert into public.external_video_candidates (source_url, payload)\n"
            "  select candidate->>'source_url', candidate\n"
            f"  from jsonb_array_elements({tag}{payload}{tag}::jsonb) as candidate\n"
            "  on conflict (source_url) do nothing\n"
            "  returning source_url\n"
            ") select count(*) as inserted_candidates from inserted;")


def blockers(item, directory):
    reasons = []
    if item.get("screening", {}).get("decision") != "shortlist":
        reasons.append("not shortlisted")
    review = item.get("review", {})
    if (review.get("status") != "approved" or not review.get("reviewer")
            or not review.get("checked_sources")):
        reasons.append("editorial review incomplete")
    rights = item.get("rights", {})
    if rights.get("status") not in {"owned", "licensed"} or not rights.get("evidence"):
        reasons.append("publishing rights missing")
    try:
        author = uuid.UUID(str(item.get("author_id")))
        if author.int == 0:
            raise ValueError()
    except (ValueError, TypeError):
        reasons.append("Datariot author profile missing")
    if item.get("category") not in CATEGORIES:
        reasons.append("unsupported learning category")
    if not item.get("title") or not item.get("creator"):
        reasons.append("title or source creator missing")
    file = directory / (item.get("media_file") or "__missing__")
    if not file.is_file() or file.suffix.lower() != ".mp4":
        reasons.append("local creator-provided MP4 missing")
    elif not 0 < file.stat().st_size <= MAX_BYTES:
        reasons.append("MP4 must be between 1 byte and 100 MiB")
    return reasons


def inspect_media(file):
    try:
        result = subprocess.run(["ffprobe", "-v", "error", "-show_format", "-show_streams",
                                 "-of", "json", str(file)], capture_output=True, check=True)
        meta = json.loads(result.stdout)
        duration = float(meta["format"]["duration"])
        stream = next(s for s in meta["streams"] if s.get("codec_type") == "video")
    except (OSError, subprocess.CalledProcessError, ValueError, KeyError, StopIteration):
        raise ValueError("Cannot probe MP4; install ffprobe and check the file") from None
    if not math.isfinite(duration) or not 0 < duration <= 180:
        raise ValueError("Short must be at most 180 seconds; no automatic trimming")
    if stream.get("codec_name") != "h264":
        raise ValueError("Use H.264 video for mobile playback")
    audio = [s for s in meta["streams"] if s.get("codec_type") == "audio"]
    if any(s.get("codec_name") != "aac" for s in audio):
        raise ValueError("Use AAC audio for mobile playback")
    return duration


def thumbnail(file, duration):
    try:
        return subprocess.run(["ffmpeg", "-v", "error", "-ss", str(duration / 2), "-i", str(file),
                               "-frames:v", "1", "-vf", "scale=640:-2", "-f", "image2pipe",
                               "-vcodec", "mjpeg", "pipe:1"], capture_output=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        raise ValueError("Cannot generate representative-frame thumbnail; check ffmpeg") from None


class Supabase:
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        self.key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        self.bucket = os.environ.get("SUPABASE_BUCKET", "videos")
        parsed = urllib.parse.urlsplit(self.url)
        if (parsed.scheme != "https" or not parsed.netloc or parsed.path or parsed.query
                or parsed.fragment or parsed.username or not self.key):
            raise ValueError("Set server-only SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        if not re.fullmatch(r"[A-Za-z0-9_-]+", self.bucket):
            raise ValueError("Invalid storage bucket")

    def call(self, path, **kwargs):
        return request(self.url + path, self.key, headers={"apikey": self.key,
                       **kwargs.pop("headers", {})}, **kwargs)

    def profile_exists(self, author_id):
        return bool(self.call("/rest/v1/profiles?" + urllib.parse.urlencode({
            "id": "eq." + author_id, "select": "id", "limit": 1})))

    def require_public_bucket(self):
        bucket = self.call(f"/storage/v1/bucket/{self.bucket}")
        if not bucket or bucket.get("public") is not True:
            raise ValueError("Configured bucket must already be public for native playback")

    def exists(self, id):
        return bool(self.call("/rest/v1/videos?" + urllib.parse.urlencode({
            "id": "eq." + id, "select": "id", "limit": 1})))

    def upload(self, key, data, mime):
        # Content-addressed keys make recovery repeatable without changing existing assets.
        self.call(f"/storage/v1/object/{self.bucket}/{key}", method="POST", data=data,
                  headers={"Content-Type": mime, "x-upsert": "true"})
        return f"{self.url}/storage/v1/object/public/{self.bucket}/{key}"

    def insert(self, row):
        # Do not overwrite an existing video on concurrent/rerun imports.
        self.call("/rest/v1/videos?on_conflict=id", method="POST",
                  data=json.dumps(row).encode(), headers={"Content-Type": "application/json",
                  "Prefer": "resolution=ignore-duplicates,return=minimal"})


def publish(item, directory, db):
    id = video_id(item)
    if db.exists(id):
        return "already imported"
    if not db.profile_exists(item["author_id"]):
        raise ValueError("Datariot author profile does not exist")
    file = directory / item["media_file"]
    duration = inspect_media(file)
    data = file.read_bytes()
    image = thumbnail(file, duration)
    digest = hashlib.sha256(data).hexdigest()
    key = f"curated/instagram/{id}/{digest}"
    url = db.upload(key + ".mp4", data, "video/mp4")
    thumb = db.upload(key + ".jpg", image, "image/jpeg")
    # Native useVideos requires a real profile id and an actual playable URL.
    row = {"id": id, "user_id": item["author_id"], "title": item["title"], "url": url,
           "thumbnail_url": thumb, "duration": duration, "size": len(data),
           "category": item["category"], "description": (
               f"Source creator: {item['creator']}\nOriginal: {canonical_url(item['source_url'])}\n"
               + item["screening"].get("reason", "")), "smart_notes": [
               "source:instagram", "rights:" + item["rights"]["status"],
               "editorial_review:approved"]}
    db.insert(row)
    return "imported"


def discover(args):
    """Read the consenting professional account's own media, not global Reels search."""
    if args.output.exists():
        raise ValueError("Output already exists; choose a new path to preserve reviews")
    token = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
    version = os.environ.get("INSTAGRAM_API_VERSION", "")
    account = os.environ.get("INSTAGRAM_USER_ID", "")
    if not token or not re.fullmatch(r"v[0-9]+\.0", version) or not account.isdigit():
        raise ValueError("Set server-only INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_API_VERSION and INSTAGRAM_USER_ID")
    endpoint = f"https://graph.instagram.com/{version}/{account}/media"
    params = {"fields": "id,caption,media_type,media_product_type,permalink,timestamp", "limit": "50"}
    found, seen, cursor = [], set(), None
    for _ in range(args.pages):
        if cursor:
            params["after"] = cursor
        page = request(endpoint + "?" + urllib.parse.urlencode(params), token)
        for media in page.get("data", []):
            if media.get("media_type") != "VIDEO" or media.get("media_product_type") != "REELS":
                continue
            url = canonical_url(media["permalink"])
            if url in seen:
                continue
            seen.add(url)
            found.append({"source_url": url, "title": "", "creator": args.creator,
                "caption": media.get("caption", ""), "category": "Education", "language": None,
                "duration_seconds": None, "evidence_type": "authorised_account_api",
                "evidence_url": url, "availability": "api_seen",
                "screening": {"decision": "pending", "reason": "", "checks_needed": "Review full video and claims"},
                "review": {"status": "pending", "reviewer": None, "checked_sources": []},
                "rights": {"status": "unknown", "evidence": None}, "author_id": None, "media_file": None})
        next_cursor = page.get("paging", {}).get("cursors", {}).get("after")
        if not page.get("paging", {}).get("next") or not next_cursor or next_cursor == cursor:
            break
        # Rebuild fixed-host requests; never follow a pagination URL containing tokens.
        cursor = next_cursor
    with args.output.open("x") as output:
        json.dump({"schema_version": 1, "items": found}, output, ensure_ascii=False, indent=2)
        output.write("\n")
    print(f"Discovered {len(found)} Reels for review; published 0")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ["catalog", "publish", "queue-sql"]:
        sub = commands.add_parser(name)
        sub.add_argument("--input", type=Path, default=ROOT / "candidates.json")
        if name == "publish":
            sub.add_argument("--apply", action="store_true", help="Upload reviewed authorised local files")
    sub = commands.add_parser("discover")
    sub.add_argument("--creator", required=True)
    sub.add_argument("--output", type=Path, required=True)
    sub.add_argument("--pages", type=int, choices=range(1, 21), default=2)
    args = parser.parse_args(argv)
    if args.command == "discover":
        discover(args)
        return 0
    items = load_manifest(args.input)
    if args.command == "queue-sql":
        print(queue_sql(items))
        return 0
    ready = []
    for item in items:
        reasons = blockers(item, args.input.parent)
        if not reasons:
            ready.append(item)
        print(f"{item['source_url']} | {item.get('screening', {}).get('decision', 'pending')} | "
              + ("; ".join(reasons) if reasons else "ready"))
    print(f"Catalog: {len(items)}; shortlisted: {sum(i.get('screening', {}).get('decision') == 'shortlist' for i in items)}; ready: {len(ready)}")
    if args.command == "publish" and args.apply:
        if not ready:
            raise ValueError("No publishable files; no network writes performed")
        db = Supabase()
        db.require_public_bucket()
        failures = 0
        for item in ready:
            try:
                print(item["source_url"], publish(item, args.input.parent, db))
            except (ValueError, RuntimeError) as error:
                failures += 1
                print(item["source_url"], "FAILED:", str(error), file=sys.stderr)
        return int(failures > 0)
    print("Preview only; published 0")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, RuntimeError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
