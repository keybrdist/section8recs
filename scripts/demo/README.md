# Demo videos

Tools for cutting a short music video from the live experience: real footage of the scenes, cut on a track's drops or
bars, with a title and an end card in the site's type. They made the 45 s Halloween demo of 2026-10-30
(`shots/halloween-2026.tsv`, seven tracks at 1920×1080) and a 32 s vertical of DESIGN's Big Brother
(`shots/big-brother-vertical.tsv`, one track at 1080×1920).

## Steps

    npm ci && npm run build && npx astro preview --port 8791

    node scripts/demo/drops.mjs <track.mp3>             # loudness per second, to spot the drop
    node scripts/demo/drops.mjs <track.mp3> 78-92       # the exact drop inside a range
    # write a shot table like the ones in shots/ (start = drop - 0.05 s)
    node scripts/demo/render.mjs scripts/demo/shots/<name>.tsv <work-dir> [--gpu]
    node scripts/demo/assemble.mjs scripts/demo/shots/<name>.tsv <work-dir> <out.mp4>
    npx astro preview stop

A shot table has one tab-separated row per shot (name, catalogue number, track, file, start in the track, warm-up
seconds, scene as named in the Scene menu, and optionally its length) and `@` lines for the size, the title card's
text and the card lengths; `table.mjs` lists them. Rows that continue the same track where the one before ends share
one unbroken stretch of audio, so a single-track video plays the track through while the scenes cut.

`render.mjs` fetches each track from the label CDN into `<work-dir>/mp3` and renders each shot into
`<work-dir>/shots` (30 fps, no audio), skipping shots already there: delete one to render it again. `assemble.mjs` draws
the cards (`cards.mjs`, templates in `cards/`), cuts each shot to its length in frames, lays the tracks under them and
writes H.264 at 30 fps with AAC 320 kbps at −14 LUFS. To try a scene before the full render, run `DUR=1 W=640 H=360
render.mjs` on a one-row table; a viewport under 760 px wide makes the site use its phone layout, so judge the look,
not the details.

Needs an ffmpeg with libx264 (`FFMPEG=<bin>` when it is not on the path) and Chromium (`CHROME=<binary>`, as for
`scripts/smoke.mjs`, when playwright-core's own is not installed).

## How a shot is rendered

`capture.mjs` runs the page on a virtual clock: `performance.now()` and `requestAnimationFrame` advance 1/60 s only when
the script steps them, and the audio engine reads the spectrum of the track at that moment instead of the analyser,
computed as `getFloatFrequencyData` would. Every second step is screenshotted, so the visuals follow the music exactly
whatever the machine's speed. It uses `window.__s8` and needs no changes to the site. The interface is hidden; the
camcorder, night-vision and FLIR read-outs, the edge text and the 8 sigil stay, as they belong to the scenes.

## Speed

Pass `--gpu` to `render.mjs` or `capture.mjs` where the browser can reach a GPU: it draws through Vulkan (ANGLE) and
stops if Chromium falls back to a CPU renderer (SwiftShader, or Mesa's llvmpipe when the device cannot be opened). On
Linux that needs read and write access to `/dev/dri/renderD128`, usually through the `render` group (in a session
started before joining it, run the command under `sg render -c '…'`), and Mesa's Vulkan driver. Measured on an AMD
Radeon 780M at 1920×1080: about 160 ms per output frame (40 ms drawing, the rest the screenshot), so a 45 s video
renders in about 4 minutes; the five 1080×1920 shots of the Big Brother vertical took under 3. The other GL flag sets
(`--use-angle=gl-egl`, no flags) still fell back to SwiftShader there.

Without a GPU, Chromium draws WebGL on the CPU (SwiftShader): on a 16-core Linux machine 0.6–1.3 s per step at the
site's desktop render scale, about 1.6–2.6 s per output frame, so 7 shots took about 50 minutes. Then:

- Render one shot at a time. Two CPU-rendering browsers in parallel were slower in total than one.
- The script waits for the GPU after every step and turns off the background compile of the other scenes. Without
  either, the screenshots stall for many seconds each.
