# Demo videos

Tools for cutting a short music video from the live experience: real footage of the scenes, cut on a track's drops or
bars, with a title and an end card in the site's type. They made the 45 s Halloween demo of 2026-10-30
(`shots/halloween-2026.tsv`, seven tracks at 1920×1080), a 50 s vertical of DESIGN's Big Brother
(`shots/big-brother-vertical.tsv`, one track at 1080×1920, with strobing cards), and a 2.5 min vertical of DESIGN's
Radio RahRa on a single scene (`shots/radio-rahra-vertical.tsv`, its title swapping between track and artist).

## Steps

    npm ci && npm run build && npx astro preview --port 8791

    node scripts/demo/drops.mjs <track.mp3>             # loudness per second, to spot the drop
    node scripts/demo/drops.mjs <track.mp3> 78-92       # the exact drop inside a range
    # write a shot table like the ones in shots/ (start = drop - 0.05 s)
    node scripts/demo/render.mjs scripts/demo/shots/<name>.tsv <work-dir> [--gpu]
    node scripts/demo/assemble.mjs scripts/demo/shots/<name>.tsv <work-dir> <out.mp4>
    npx astro preview stop

A shot table has one tab-separated row per shot (name, catalogue number, track, file, start in the track, warm-up
seconds, scene as named in the Scene menu, and optionally its length) and `@` lines for the size, the title card's text,
the card lengths and `@flash`, which strobes each card every other frame over the footage next to it instead of a fade.
`@title` can list several titles for the card to swap between; `table.mjs` lists them. Rows that continue the same track
where the one before ends share one unbroken stretch of audio, so a single-track video plays the track through while the
scenes cut.

`render.mjs` fetches each track from the label CDN into `<work-dir>/mp3` and renders each shot into
`<work-dir>/shots` (30 fps, no audio), skipping shots already there: delete one to render it again. `assemble.mjs` draws
the cards (`cards.mjs`, templates in `cards/`), cuts each shot to its length in frames, lays the tracks under them and
writes H.264 at 30 fps with AAC 320 kbps at −14 LUFS. To try a scene before the full render, run `DUR=1 W=640 H=360
render.mjs` on a one-row table; a viewport under 760 px wide makes the site use its phone layout, so judge the look,
not the details.

Needs an ffmpeg with libx264 (`FFMPEG=<bin>` when it is not on the path) and Chromium (`CHROME=<binary>`, as for
`scripts/smoke.mjs`, when playwright-core's own is not installed).

## The phone look

A locked-off frame of a scene can look flat. With an `@phone` line, every shot in the table is filmed as a phone held up to a
desktop monitor showing the site, after the operator's own iPhone footage of it (2026-10-30). The monitor is `@screen`
in size (3440×1440 by default) and shows the site's desktop interface. Around it are a browser bar, a bezel, a desk and the
screen's glow, with a line texture at the screen's pixel pitch that shows as rows close up and as moiré further out. The camera
pushes in, drifts and pulls back on the beats given, and shakes like a stabilised phone. `shots/radio-rahra-phone.tsv` is the
15 s prototype:

    @screen	3440x1440
    @phone	0@.5,.5,1.35 2.5@.55,.58,2.2,-.8 6@.6,.62,4.6,.6 10@.45,.5,4,1.4 12.5@.5,.48,2.1,-.3

A beat `t@cx,cy,z[,roll]` heads, from t seconds into the shot, for the point (cx, cy) of the screen (0–1 across and down) at
zoom z, where 1 means the screen's width fills the frame's width, rolled `roll` degrees. The camera eases there over about
2 s. A ninth column on a row gives that shot its own beats. The shake, the exposure and the easing are measured from the
reference and documented in `phone.mjs`. It costs no render time: the camera is a CSS transform of the room page, set on the
same virtual clock.

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
