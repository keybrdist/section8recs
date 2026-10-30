# Demo videos

Tools for cutting a short music video from the live experience: real footage of the scenes, each cut on a track's drop,
with a title and an end card in the site's type. They made the 45 s Halloween demo of 2026-10-30
(`shots/halloween-2026.tsv`).

## Steps

    npm ci && npm run build && npx astro preview --port 8791

    node scripts/demo/drops.mjs <track.mp3>             # loudness per second, to spot the drop
    node scripts/demo/drops.mjs <track.mp3> 78-92       # the exact drop inside a range
    # write a shot table like shots/halloween-2026.tsv (start = drop - 0.05 s)
    scripts/demo/render.sh scripts/demo/shots/<name>.tsv <work-dir>
    scripts/demo/assemble.sh scripts/demo/shots/<name>.tsv <work-dir> <out.mp4>
    npx astro preview stop

`render.sh` fetches each track from the label CDN into `<work-dir>/mp3` and renders each shot into
`<work-dir>/shots` (6 s, 1920×1080, 30 fps, no audio), skipping shots already there: delete one to render it again.
`assemble.sh` renders the cards (`cards.mjs`, text in `cards/*.html`) when they are missing, cuts 5.9 s of each shot, lays
the tracks under them and writes H.264 1080p30 with AAC 320 kbps at −14 LUFS. To try a shot before the full render,
run `DUR=1 W=640 H=360 render.sh` on a one-row table; a small viewport makes the site use its phone layout, so judge the
look, not the details.

Needs an ffmpeg with libx264 (`FFMPEG=<bin>` when it is not on the path) and Chromium (`CHROME=<binary>`, as for
`scripts/smoke.mjs`, when playwright-core's own is not installed).

## How a shot is rendered

`capture.mjs` runs the page on a virtual clock: `performance.now()` and `requestAnimationFrame` advance 1/60 s only when
the script steps them, and the audio engine reads the spectrum of the track at that moment instead of the analyser,
computed as `getFloatFrequencyData` would. Every second step is screenshotted, so the visuals follow the music exactly
whatever the machine's speed. It uses `window.__s8` and needs no changes to the site. The interface is hidden; the
camcorder, night-vision and FLIR read-outs, the edge text and the 8 sigil stay, as they belong to the scenes.

## Speed

Without a GPU, Chromium draws WebGL on the CPU (SwiftShader): on a 16-core Linux machine 0.6–1.3 s per step at the
site's desktop render scale, about 1.6–2.6 s per output frame, so 7 shots took about 50 minutes. What matters:

- One shot at a time. Two CPU-rendering browsers in parallel were slower in total than one.
- The script waits for the GPU after every step and turns off the background compile of the other scenes. Without
  either, the screenshots stall for many seconds each.
- A GPU would make steps take milliseconds, leaving the screenshot (about 0.2 s) as the cost: a 45 s video in roughly
  10 minutes (not yet measured). On Linux the browser needs read and write access to `/dev/dri/renderD128` (usually
  the `render` group) and the Mesa drivers; then try `--use-angle=vulkan` or `--use-gl=angle --use-angle=gl-egl` in
  place of the SwiftShader flags in `capture.mjs`, and check that the WebGL renderer name is no longer SwiftShader.
