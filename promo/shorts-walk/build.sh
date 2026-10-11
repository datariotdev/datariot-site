#!/usr/bin/env bash
# Rebuilds datariot-short-walk.mp4 from scene.html + audio.py.
# Needs: node + playwright (global), ffmpeg, python3 with numpy.
set -euo pipefail
cd "$(dirname "$0")"
WORK="${1:-$(mktemp -d)}"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
export PLAYWRIGHT_PKG="${PLAYWRIGHT_PKG:-$NODE_PATH/playwright}"
rm -rf "$WORK/frames"
node render.cjs "$WORK/frames" --workers "${WORKERS:-4}"
python3 -I audio.py "$WORK/audio.wav"
ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f_%05d.png" -i "$WORK/audio.wav" \
  -af "volume=-3.6dB" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high \
  -movflags +faststart -c:a aac -b:a 192k -shortest datariot-short-walk.mp4
echo "built $(pwd)/datariot-short-walk.mp4"
