# Datariot Seeder

CLI tool to download YouTube debate videos, clip segments by timecodes, and upload them as seed content to Supabase.

## Prerequisites

### FFmpeg

The script requires `ffmpeg` and `ffprobe` to be installed and available in your `PATH`.

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu / Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
1. Download from [ffmpeg.org/download](https://ffmpeg.org/download.html)
2. Extract and add the `bin/` folder to your system `PATH`
3. Verify: `ffmpeg -version`

### Python 3.11+

```bash
python --version  # should be 3.11+
```

## Setup

```bash
cd datariot-seeder

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
# .venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt
```

### Configure `.env`

Copy the template and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key
SUPABASE_BUCKET=debate-videos
```

> **Note:** Use the **service role key** (not anon key) — the seeder inserts records with `user_id = NULL`.

### Supabase Storage

Make sure the `debate-videos` bucket exists in your Supabase project:
1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket named `debate-videos`
3. Set it to **Public** if you want public URLs

## Usage

### Fill `clips.json`

Each entry represents one YouTube video with one or more clips to extract:

```json
[
  {
    "youtube_url": "https://youtube.com/watch?v=abc123",
    "debate_thesis": "AI will replace 50% of jobs by 2035",
    "clips": [
      {
        "start": "00:02:15",
        "end": "00:03:10",
        "side": "for",
        "label": "Economic displacement argument"
      },
      {
        "start": "00:08:40",
        "end": "00:09:35",
        "side": "against",
        "label": "Historical job creation rebuttal"
      }
    ]
  }
]
```

| Field | Description |
|-------|-------------|
| `youtube_url` | Any valid YouTube URL |
| `debate_thesis` | The debate topic / thesis statement |
| `start` / `end` | Timecodes in `HH:MM:SS` or `MM:SS` format |
| `side` | `"for"` or `"against"` |
| `label` | Short description of the argument |

> **Clips must be ≤ 60 seconds.** Longer clips are automatically trimmed.

### Run

```bash
# Process all debates
python seed.py

# Preview without downloading/uploading
python seed.py --dry-run

# Filter by thesis substring
python seed.py --debate "AI will replace jobs"

# Use a custom input file
python seed.py --input my_clips.json
```

## Pipeline

1. **Download** — `yt-dlp` downloads the video (≤1080p mp4) to `/tmp/datariot/`
2. **Clip** — `ffmpeg` cuts segments using stream copy (no re-encoding, fast)
3. **Upload** — Clips go to Supabase Storage at `seed/{post_id}/{side}_{uuid}.mp4`
4. **Database** — Creates `posts` (debate thesis) + `videos` + `comments` (argument) records
5. **Cleanup** — Temp files are removed after successful upload

## Duplicate Detection

The script checks if a clip with the same `post_id + side + label` combo already exists. Duplicates are skipped automatically.

## Error Handling

- Failed YouTube downloads → logged, remaining debates continue
- Failed clips → logged, other clips in the same debate continue
- Upload failures → retried 3 times with exponential backoff
- At the end, a summary table shows success/skip/error counts
