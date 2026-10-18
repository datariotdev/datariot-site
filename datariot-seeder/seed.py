#!/usr/bin/env python3
"""
Datariot Seeder — Download YouTube debate clips, cut segments, upload to Supabase.

Usage:
    python seed.py                          # process all debates in clips.json
    python seed.py --debate "AI will"       # filter by thesis substring
    python seed.py --dry-run                # preview without downloading/uploading
    python seed.py --input my_clips.json    # custom input file
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import yt_dlp
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_BUCKET: str = os.getenv("SUPABASE_BUCKET", "debate-videos")

TMP_DIR = Path("/tmp/datariot")
MAX_CLIP_DURATION = 60  # seconds
UPLOAD_RETRIES = 3

console = Console()


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ClipSpec:
    """Single clip to extract from a video."""
    start: str
    end: str
    side: str  # "for" | "against"
    label: str


@dataclass
class DebateSpec:
    """One debate entry from the input JSON."""
    youtube_url: str
    debate_thesis: str
    clips: list[ClipSpec] = field(default_factory=list)


@dataclass
class SeedResult:
    """Tracks outcomes for one clip."""
    label: str
    side: str
    status: str = "pending"  # "ok" | "skipped" | "error"
    error_msg: str = ""
    public_url: str = ""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def timecode_to_seconds(tc: str) -> float:
    """Convert HH:MM:SS or MM:SS to seconds."""
    parts = tc.strip().split(":")
    parts = [float(p) for p in parts]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    return parts[0]


def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r"(?:v=|/v/|youtu\.be/)([a-zA-Z0-9_-]{11})",
        r"(?:embed/)([a-zA-Z0-9_-]{11})",
        r"(?:shorts/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    # Fallback: hash the URL
    return uuid.uuid5(uuid.NAMESPACE_URL, url).hex[:11]


def get_clip_duration_seconds(filepath: str) -> float:
    """Probe actual duration of an mp4 file via ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                filepath,
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return float(result.stdout.strip())
    except Exception:
        return 0.0


# ---------------------------------------------------------------------------
# Pipeline steps
# ---------------------------------------------------------------------------

def download_video(youtube_url: str, video_id: str) -> Optional[Path]:
    """Download YouTube video to /tmp/datariot/{video_id}/source.mp4."""
    output_dir = TMP_DIR / video_id
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "source.mp4"

    if output_path.exists():
        console.print(f"  [dim]Source already downloaded: {output_path}[/dim]")
        return output_path

    ydl_opts: dict[str, Any] = {
        "format": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
        "outtmpl": str(output_path),
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
        "progress_hooks": [_yt_progress_hook],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
    except Exception as e:
        console.print(f"  [red]✗ Download failed: {e}[/red]")
        return None

    if not output_path.exists():
        # yt-dlp may add extensions; find the downloaded file
        candidates = list(output_dir.glob("source.*"))
        if candidates:
            return candidates[0]
        console.print("  [red]✗ Downloaded file not found[/red]")
        return None

    return output_path


def _yt_progress_hook(d: dict[str, Any]) -> None:
    """Progress callback for yt-dlp."""
    if d["status"] == "downloading":
        pct = d.get("_percent_str", "?%").strip()
        speed = d.get("_speed_str", "?").strip()
        console.print(f"  [cyan]↓ {pct} @ {speed}[/cyan]", end="\r")
    elif d["status"] == "finished":
        console.print("  [green]↓ Download complete[/green]")


def clip_video(
    source_path: Path,
    clip: ClipSpec,
    output_dir: Path,
) -> Optional[Path]:
    """Cut a clip from source video using ffmpeg stream copy."""
    start_sec = timecode_to_seconds(clip.start)
    end_sec = timecode_to_seconds(clip.end)
    duration = end_sec - start_sec

    if duration <= 0:
        console.print(f"  [red]✗ Invalid timecodes: {clip.start} → {clip.end}[/red]")
        return None

    # Enforce max duration
    if duration > MAX_CLIP_DURATION:
        console.print(
            f"  [yellow]⚠ Clip too long ({duration:.0f}s), trimming to {MAX_CLIP_DURATION}s[/yellow]"
        )
        end_sec = start_sec + MAX_CLIP_DURATION
        duration = MAX_CLIP_DURATION

    filename = f"{clip.side}_{uuid.uuid4().hex[:8]}.mp4"
    output_path = output_dir / filename

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_sec),
        "-to", str(end_sec),
        "-i", str(source_path),
        "-c", "copy",
        "-avoid_negative_ts", "make_zero",
        str(output_path),
    ]

    try:
        subprocess.run(cmd, capture_output=True, check=True)
    except subprocess.CalledProcessError as e:
        console.print(f"  [red]✗ FFmpeg failed: {e.stderr.decode()[:200]}[/red]")
        return None

    if not output_path.exists() or output_path.stat().st_size == 0:
        console.print("  [red]✗ Output clip is empty or missing[/red]")
        return None

    actual_dur = get_clip_duration_seconds(str(output_path))
    console.print(
        f"  [green]✓ Clipped {clip.start}→{clip.end} "
        f"({actual_dur:.1f}s) → {filename}[/green]"
    )
    return output_path


def upload_to_supabase(
    supabase_client: Client,
    local_path: Path,
    remote_path: str,
) -> Optional[str]:
    """Upload file to Supabase Storage with retry logic. Returns public URL."""
    for attempt in range(1, UPLOAD_RETRIES + 1):
        try:
            with open(local_path, "rb") as f:
                data = f.read()

            supabase_client.storage.from_(SUPABASE_BUCKET).upload(
                path=remote_path,
                file=data,
                file_options={"content-type": "video/mp4", "upsert": "true"},
            )

            pub = supabase_client.storage.from_(SUPABASE_BUCKET).get_public_url(remote_path)
            console.print(f"  [green]✓ Uploaded → {remote_path}[/green]")
            return pub

        except Exception as e:
            console.print(
                f"  [yellow]⚠ Upload attempt {attempt}/{UPLOAD_RETRIES} failed: {e}[/yellow]"
            )
            if attempt < UPLOAD_RETRIES:
                time.sleep(2 ** attempt)  # exponential back-off

    console.print(f"  [red]✗ Upload failed after {UPLOAD_RETRIES} retries[/red]")
    return None


def find_or_create_post(
    supabase_client: Client,
    thesis: str,
) -> Optional[str]:
    """Find existing debate post by thesis text, or create one. Returns post ID."""
    # Search for existing post with this thesis
    resp = (
        supabase_client.table("posts")
        .select("id")
        .eq("content", thesis)
        .limit(1)
        .execute()
    )

    if resp.data:
        post_id = resp.data[0]["id"]
        console.print(f"  [dim]Found existing post: {post_id}[/dim]")
        return post_id

    # Create new debate post (seed content — no user_id)
    resp = (
        supabase_client.table("posts")
        .insert({
            "content": thesis,
            "user_id": None,
            "is_published": True,
        })
        .execute()
    )

    if resp.data:
        post_id = resp.data[0]["id"]
        console.print(f"  [green]✓ Created debate post: {post_id}[/green]")
        return post_id

    console.print("  [red]✗ Failed to create debate post[/red]")
    return None


def is_duplicate_clip(
    supabase_client: Client,
    post_id: str,
    side: str,
    label: str,
) -> bool:
    """Check if a clip with the same post_id + side + label already exists."""
    prefix = f"{side.upper()}:|"
    search_text = f"{prefix}{label}"

    resp = (
        supabase_client.table("comments")
        .select("id")
        .eq("post_id", post_id)
        .like("text", f"%{search_text}%")
        .limit(1)
        .execute()
    )

    return bool(resp.data)


def record_in_db(
    supabase_client: Client,
    post_id: str,
    clip: ClipSpec,
    public_url: str,
    duration_seconds: float,
) -> bool:
    """Insert video record and debate comment/argument into DB."""
    try:
        # 1. Insert into videos table
        video_resp = (
            supabase_client.table("videos")
            .insert({
                "user_id": None,
                "title": clip.label,
                "url": public_url,
                "duration": int(duration_seconds),
                "is_published": True,
            })
            .execute()
        )

        video_id = video_resp.data[0]["id"] if video_resp.data else None

        # 2. Insert debate argument as comment
        side_prefix = f"{clip.side.upper()}:|"
        comment_text = f"{side_prefix}{clip.label}"

        supabase_client.table("comments").insert({
            "post_id": post_id,
            "user_id": None,
            "text": comment_text,
            "video_id": video_id,
            "is_published": True,
        }).execute()

        console.print(f"  [green]✓ DB records created (video + comment)[/green]")
        return True

    except Exception as e:
        console.print(f"  [red]✗ DB insert failed: {e}[/red]")
        return False


def cleanup(video_id: str) -> None:
    """Remove temporary files for a video."""
    target = TMP_DIR / video_id
    if target.exists():
        shutil.rmtree(target)
        console.print(f"  [dim]Cleaned up {target}[/dim]")


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def process_debate(
    supabase_client: Client,
    debate: DebateSpec,
    dry_run: bool = False,
) -> list[SeedResult]:
    """Process one debate entry: download → clip → upload → record."""
    results: list[SeedResult] = []
    video_id = extract_video_id(debate.youtube_url)

    console.print()
    console.rule(f"[bold cyan]{debate.debate_thesis}[/bold cyan]")
    console.print(f"  URL: {debate.youtube_url}")
    console.print(f"  Video ID: {video_id}")
    console.print(f"  Clips: {len(debate.clips)}")

    if dry_run:
        for clip in debate.clips:
            r = SeedResult(label=clip.label, side=clip.side, status="skipped",
                           error_msg="dry-run")
            results.append(r)
            console.print(
                f"  [dim]  • [{clip.side.upper()}] {clip.start}→{clip.end}: {clip.label}[/dim]"
            )
        return results

    # --- Step 1: Download ---
    console.print("\n  [bold]Step 1: Download[/bold]")
    source_path = download_video(debate.youtube_url, video_id)
    if source_path is None:
        for clip in debate.clips:
            results.append(SeedResult(
                label=clip.label, side=clip.side,
                status="error", error_msg="Download failed",
            ))
        return results

    # --- Step 2: Find or create debate post ---
    console.print("\n  [bold]Step 2: Database setup[/bold]")
    post_id = find_or_create_post(supabase_client, debate.debate_thesis)
    if post_id is None:
        for clip in debate.clips:
            results.append(SeedResult(
                label=clip.label, side=clip.side,
                status="error", error_msg="Post creation failed",
            ))
        return results

    # --- Step 3: Process each clip ---
    clips_dir = TMP_DIR / video_id / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)

    for i, clip in enumerate(debate.clips, 1):
        console.print(f"\n  [bold]Clip {i}/{len(debate.clips)}:[/bold] [{clip.side.upper()}] {clip.label}")
        result = SeedResult(label=clip.label, side=clip.side)

        # Duplicate check
        if is_duplicate_clip(supabase_client, post_id, clip.side, clip.label):
            console.print("  [yellow]⚠ Already exists — skipping[/yellow]")
            result.status = "skipped"
            result.error_msg = "duplicate"
            results.append(result)
            continue

        # Clip
        clip_path = clip_video(source_path, clip, clips_dir)
        if clip_path is None:
            result.status = "error"
            result.error_msg = "FFmpeg clip failed"
            results.append(result)
            continue

        duration = get_clip_duration_seconds(str(clip_path))

        # Upload
        remote_path = f"seed/{post_id}/{clip_path.name}"
        public_url = upload_to_supabase(supabase_client, clip_path, remote_path)
        if public_url is None:
            result.status = "error"
            result.error_msg = "Upload failed"
            results.append(result)
            continue

        # Record in DB
        ok = record_in_db(supabase_client, post_id, clip, public_url, duration)
        if ok:
            result.status = "ok"
            result.public_url = public_url
        else:
            result.status = "error"
            result.error_msg = "DB insert failed"

        results.append(result)

    # --- Step 4: Cleanup ---
    console.print(f"\n  [bold]Cleanup[/bold]")
    cleanup(video_id)

    return results


def load_clips(path: str) -> list[DebateSpec]:
    """Load and parse the clips JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    debates: list[DebateSpec] = []
    for entry in raw:
        clips = [
            ClipSpec(
                start=c["start"],
                end=c["end"],
                side=c["side"],
                label=c["label"],
            )
            for c in entry.get("clips", [])
        ]
        debates.append(DebateSpec(
            youtube_url=entry["youtube_url"],
            debate_thesis=entry["debate_thesis"],
            clips=clips,
        ))

    return debates


def print_summary(all_results: list[SeedResult]) -> None:
    """Print a rich summary table at the end."""
    table = Table(title="Seed Results", show_lines=True)
    table.add_column("Side", style="bold", width=8)
    table.add_column("Label", min_width=30)
    table.add_column("Status", width=10)
    table.add_column("Details", min_width=20)

    ok_count = 0
    skip_count = 0
    err_count = 0

    for r in all_results:
        if r.status == "ok":
            ok_count += 1
            status_str = "[green]✓ OK[/green]"
            detail = r.public_url[:60] + "..." if len(r.public_url) > 60 else r.public_url
        elif r.status == "skipped":
            skip_count += 1
            status_str = "[yellow]⊘ Skip[/yellow]"
            detail = r.error_msg
        else:
            err_count += 1
            status_str = "[red]✗ Error[/red]"
            detail = r.error_msg

        side_color = "cyan" if r.side.lower() == "for" else "magenta"
        table.add_row(f"[{side_color}]{r.side.upper()}[/{side_color}]", r.label, status_str, detail)

    console.print()
    console.print(table)
    console.print()
    console.print(Panel(
        f"[green]✓ Uploaded: {ok_count}[/green]  |  "
        f"[yellow]⊘ Skipped: {skip_count}[/yellow]  |  "
        f"[red]✗ Errors: {err_count}[/red]",
        title="Summary",
        border_style="bold",
    ))


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(
        description="Datariot Seeder — seed debate videos from YouTube clips",
    )
    parser.add_argument(
        "--input", "-i",
        default="clips.json",
        help="Path to the clips JSON file (default: clips.json)",
    )
    parser.add_argument(
        "--debate", "-d",
        default=None,
        help="Filter: only process debates whose thesis contains this substring",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be done without downloading or uploading",
    )
    args = parser.parse_args()

    # --- Banner ---
    console.print(Panel(
        "[bold cyan]DATARIOT SEEDER[/bold cyan]\n"
        "[dim]YouTube debate clips → Supabase[/dim]",
        border_style="cyan",
    ))

    # --- Validate env ---
    if not args.dry_run:
        if not SUPABASE_URL or not SUPABASE_KEY:
            console.print("[red]✗ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env[/red]")
            sys.exit(1)

        # Check ffmpeg is available
        if shutil.which("ffmpeg") is None:
            console.print("[red]✗ ffmpeg not found in PATH. Please install ffmpeg.[/red]")
            sys.exit(1)

    # --- Load clips ---
    input_path = args.input
    if not os.path.exists(input_path):
        console.print(f"[red]✗ Input file not found: {input_path}[/red]")
        sys.exit(1)

    debates = load_clips(input_path)
    console.print(f"Loaded [bold]{len(debates)}[/bold] debate(s) from {input_path}")

    # --- Filter ---
    if args.debate:
        debates = [
            d for d in debates
            if args.debate.lower() in d.debate_thesis.lower()
        ]
        console.print(f"Filtered to [bold]{len(debates)}[/bold] debate(s) matching '{args.debate}'")

    if not debates:
        console.print("[yellow]No debates to process.[/yellow]")
        return

    # --- Init Supabase ---
    supabase_client: Optional[Client] = None
    if not args.dry_run:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        console.print("[green]✓ Supabase client initialized[/green]")

    # --- Process ---
    all_results: list[SeedResult] = []

    for debate in debates:
        results = process_debate(
            supabase_client=supabase_client,  # type: ignore[arg-type]
            debate=debate,
            dry_run=args.dry_run,
        )
        all_results.extend(results)

    # --- Summary ---
    print_summary(all_results)


if __name__ == "__main__":
    main()
