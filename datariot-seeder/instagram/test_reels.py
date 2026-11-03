import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

import reels


class CurationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / "clip.mp4").write_bytes(b"test media")
        self.item = {
            "source_url": "https://www.instagram.com/reel/AbC_123/", "title": "How it works",
            "creator": "Original educator", "category": "Engineering", "media_file": "clip.mp4",
            "author_id": "11111111-1111-4111-8111-111111111111",
            "screening": {"decision": "shortlist", "reason": "Explains a mechanism"},
            "review": {"status": "approved", "reviewer": "Editor", "checked_sources": ["manual review"]},
            "rights": {"status": "licensed", "evidence": "PRIVATE licensing record"}}

    def test_url_normalisation_and_rejection(self):
        self.assertEqual(reels.canonical_url("https://instagram.com/reels/AbC_123?igsh=test"), self.item["source_url"])
        for bad in ["http://instagram.com/reel/a/", "https://instagram.com.evil/reel/a/",
                    "https://instagram.com@evil.test/reel/a/", "https://instagram.com/stories/a/",
                    "https://instagram.com:443/reel/a/"]:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                reels.canonical_url(bad)

    def test_no_rights_review_or_profile_cannot_publish(self):
        self.assertEqual(reels.blockers(self.item, self.root), [])
        for key, value in [("rights", {"status": "unknown"}), ("review", {"status": "pending"}),
                           ("author_id", "00000000-0000-0000-0000-000000000000"),
                           ("media_file", "missing.mp4"), ("screening", {"decision": "reject"})]:
            item = copy.deepcopy(self.item)
            item[key] = value
            self.assertTrue(reels.blockers(item, self.root), key)

    def test_dedup_uses_canonical_original(self):
        item = dict(self.item, source_url="https://instagram.com/reels/AbC_123/?tracking=1")
        self.assertEqual(reels.video_id(item), reels.video_id(self.item))
        self.assertEqual(reels.video_id(dict(item, source_url="https://instagram.com/p/AbC_123/")), reels.video_id(self.item))
        file = self.root / "manifest.json"
        file.write_text(json.dumps({"schema_version": 1, "items": [self.item, item]}))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            reels.load_manifest(file)

    def test_default_catalogue_is_not_publishable(self):
        items = reels.load_manifest(reels.ROOT / "candidates.json")
        self.assertGreaterEqual(len(items), 12)
        self.assertEqual(len({reels.video_id(i) for i in items}), len(items))
        self.assertTrue(all(reels.blockers(i, reels.ROOT) for i in items))
        with patch.object(reels, "request") as network, patch("builtins.print"):
            self.assertEqual(reels.main(["publish"]), 0)
            with self.assertRaisesRegex(ValueError, "No publishable"):
                reels.main(["publish", "--apply"])
            network.assert_not_called()

    def test_queue_export_preserves_reviews_and_quotes_untrusted_text(self):
        item = copy.deepcopy(self.item)
        item["title"] = "It's a lesson $datariot_candidates$; DROP TABLE videos; --"
        query = reels.queue_sql([item])
        self.assertIn("on conflict do nothing", query)
        self.assertNotIn("do update", query)
        tag = "$datariot_candidates_$"
        payload = query.split(tag)[1]
        self.assertEqual(json.loads(payload), [item])

    def test_import_skips_existing_and_preserves_source_privacy(self):
        db = Mock()
        db.exists.return_value = True
        self.assertEqual(reels.publish(self.item, self.root, db), "already imported")
        db.upload.assert_not_called()
        db.exists.return_value = False
        db.profile_exists.return_value = True
        db.upload.side_effect = ["https://storage.example/real.mp4", "https://storage.example/frame.jpg"]
        with patch.object(reels, "inspect_media", return_value=60), patch.object(reels, "thumbnail", return_value=b"jpeg"):
            self.assertEqual(reels.publish(self.item, self.root, db), "imported")
        row = db.insert.call_args.args[0]
        self.assertEqual(row["url"], "https://storage.example/real.mp4")
        self.assertIn(self.item["source_url"], row["description"])
        self.assertIn(self.item["creator"], row["description"])
        self.assertNotIn("PRIVATE", json.dumps(row))
        self.assertNotIn("is_published", row)  # absent from the current videos schema

    def test_missing_profile_and_invalid_media_fail_before_upload(self):
        db = Mock()
        db.exists.return_value = False
        db.profile_exists.return_value = False
        with self.assertRaisesRegex(ValueError, "profile"):
            reels.publish(self.item, self.root, db)
        db.upload.assert_not_called()
        db.profile_exists.return_value = True
        with patch.object(reels, "inspect_media", side_effect=ValueError("invalid media")):
            with self.assertRaisesRegex(ValueError, "invalid media"):
                reels.publish(self.item, self.root, db)
        db.upload.assert_not_called()

    def test_discovery_pages_fixed_host_and_filters_non_reels(self):
        responses = [
            {"data": [{"media_type": "IMAGE"}, {"media_type": "VIDEO", "media_product_type": "REELS",
                "permalink": self.item["source_url"], "caption": "Lesson"}],
             "paging": {"next": "https://evil.test/?access_token=SECRET", "cursors": {"after": "cursor"}}},
            {"data": [{"media_type": "VIDEO", "media_product_type": "REELS", "permalink": self.item["source_url"]}]}]
        target = self.root / "discovered.json"
        with patch.dict("os.environ", {"INSTAGRAM_ACCESS_TOKEN": "SECRET", "INSTAGRAM_API_VERSION": "v99.0", "INSTAGRAM_USER_ID": "123"}), patch.object(reels, "request", side_effect=responses) as network, patch("builtins.print"):
            reels.main(["discover", "--creator", "Educator", "--output", str(target)])
        for call in network.call_args_list:
            self.assertTrue(call.args[0].startswith("https://graph.instagram.com/v99.0/123/media?"))
            self.assertNotIn("SECRET", call.args[0])
        self.assertEqual(len(reels.load_manifest(target)), 1)
        self.assertEqual(reels.load_manifest(target)[0]["review"]["status"], "pending")


if __name__ == "__main__":
    unittest.main()
