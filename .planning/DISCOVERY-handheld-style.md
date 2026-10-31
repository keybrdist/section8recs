---
subject: Demo videos that feel filmed on a phone (handheld) instead of a locked-off frame of the scene
status: prototyped (awaiting the operator's verdict before a full-length render)
updated: 2026-10-31T09:55:00Z
source: free-text (operator request, relayed from the parent thread)
plan: null
---

# Discovery: a handheld phone-camera look for the scene videos

## Recommendation in one paragraph

The reference is a phone filming the site on a desktop monitor, so the look is a filmed screen through a slow,
stabilised handheld camera, not shake added to a full-frame render. Build it in the capture's own Chromium: the site
in an iframe at a desktop size on a monitor in a room page, filmed by a per-frame CSS transform driven by eased
framing beats plus noise fitted to the reference's measured shake (O3 with O2). That is `capture.mjs --phone` and
`phone.mjs`, used from a shot table through `@phone` and `@screen`; the prototype is
`scripts/demo/shots/radio-rahra-phone.tsv`. It needs no new runtime and costs no render time. Next steps, in order of
effect for the cost: a room plate behind the monitor, a curved screen, motion blur from both 1/60 s steps.

## Starting Point

The operator's verdict on the 2.5 min Radio RahRa vertical (`scripts/demo/shots/radio-rahra-vertical.tsv`, scene 07
The plain, one locked-off shot) was "the still vertical video just doesn't capture the whole essence of the scene".
They filmed the site on their phone (`IMG_1657.mp4`) as the reference and want our renders to feel like that. The
reference footage is the operator's and stays out of this public repository. Its analysis (contact sheet, motion
trace) lives in `.scratch/handheld/` of the primary checkout.

## Evidence

The kit and the site camera:

- `scripts/demo/capture.mjs` steps the page on a virtual clock (1/60 s, every second step screenshotted, 30 fps) and
  pipes JPEG screenshots to ffmpeg. Anything that runs in the page per step is frame-exact and deterministic.
- `site/src/v4-loop.js:155-192`: the scene cameras (`walk`, `run`, `hand`, `spin`, the side scroll) move the world
  inside the shaders. `uShake` and `CAM.whip` add shake and whip pans to the scene and light shafts, but the frame of
  the video never moves: there is no lens, no framing change, no roll. The plain (`site/src/v4-scenes.js:13`) only has
  the continuous side scroll, so its render reads as a static frame.
- The rendered 145.9 s The plain shot at 1080×1920 (`/tmp/s8demo/rahra/shots/1-plain.mp4`, CRF 12) is available for
  post-processing experiments.
- Probe 2026-10-30: a CSS `transform` (translate, rotate, scale) set on `body` per output frame through the virtual
  clock shows in the CDP screenshot, with `#world` and the fixed overlays (edge text, 8 sigil) moving together like a
  filmed frame; a 1 s 1080×1920 GPU render cost the same ~135 ms per frame with and without it. So a virtual camera can
  run in the capture's own page, sub-pixel, without any new runtime.
- Probe 2026-10-30: `capture.mjs` on `main` hung at `page.click('#enterSound')` since `c5e9463` (release pages enter
  and play by themselves; the button it found is the gate's hidden "Play with sound"). Fixed in this branch: step the
  clock until the track plays, press the button through the DOM only if it never does.
- ffmpeg 7.0.2 (static, has libvidstab 1.20 and frei0r): `crop` x/y, `rotate` angle and `lenscorrection` take runtime
  commands; `perspective` takes per-frame expressions with `eval=frame` (frame counters `in`/`on`, no `t`) and
  interpolates sub-pixel. `crop` moves in whole pixels, so slow drift through it steps visibly (`ffmpeg -h filter=…`).

External sources (one research pass, 2026-10-30):

- Hand tremor is 8–12 Hz physiologically ([AAFP](https://www.aafp.org/afp/1999/0315/p1565),
  [J Neurophysiol](https://journals.physiology.org/doi/full/10.1152/jn.00519.2014)); handset stabiliser literature
  puts hand jitter at 2–18 Hz ([US8170408B2](https://patents.google.com/patent/US8170408B2/en)); smartphone-held tremor
  peaks at 5–12 Hz ([PMC9547012](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9547012/)). iPhones stabilise video in
  software ([AVCaptureVideoStabilizationMode](https://developer.apple.com/documentation/avfoundation/avcapturevideostabilizationmode)),
  so phone footage keeps the slow drift and only a residue of the tremor. That is an inference; the reference trace
  is the measurement that settles it.
- Procedural shake in the established tools is octave-summed noise with amplitude and frequency per axis: After
  Effects `wiggle` ([docs](https://ae-expressions.docsforadobe.dev/objects/property/)), Unreal's Perlin shake pattern
  ([docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/camera-shakes-in-unreal-engine)). Blender's
  Camera Shakify replays recorded real camera motion (GPL-3 code, CC0 data,
  [repo](https://github.com/EatTheFuture/camera_shakify)).
- Camera-path transfer: the standard stabilisation recipe (corners, pyramidal LK, `estimateAffinePartial2D`,
  accumulate, smooth) gives the per-frame path of a clip
  ([LearnOpenCV](https://learnopencv.com/video-stabilization-using-point-feature-matching-in-opencv/)). Replaying that
  path on a clean render transfers the operator's hand. vid.stab's `global_motions.trf` (one `time x y alpha zoom`
  line per frame) is the supported way to feed a computed path into `vidstabtransform`
  ([trf format](https://github.com/georgmartius/vid.stab/blob/master/docs/trf-format.md)).
- Gyroflow (GPLv3, has a CLI, [docs](https://docs.gyroflow.xyz/app/advanced-usage/command-line-cli)) needs gyro data,
  and the native iPhone Camera app records none it can use; only third-party logger apps do
  ([supported phones](https://docs.gyroflow.xyz/app/getting-started/supported-cameras/mobile-phones)). Not usable on
  `IMG_1657.mp4`.
- Filmed-screen artefacts: the AIM 2019 LCDMoire dataset models a phone photographing an LCD
  ([arXiv:1911.02498](https://arxiv.org/abs/1911.02498)); rolling-shutter wobble on iPhone footage is modelled in
  Karpenko et al. ([Stanford](https://graphics.stanford.edu/papers/stabilization/)).

The tools, for a headless Linux pipeline fed by our frame-stepped renders:

| Tool | Licence | Headless on Linux | Fit here |
|---|---|---|---|
| In-page pass in the capture's own Chromium (CSS transform or a WebGL quad, three.js is MIT) | ours / MIT | yes, already running | Best: no new runtime, frame-exact on the virtual clock, sub-pixel, can use sub-steps for motion blur |
| ffmpeg `perspective`/`rotate`/`crop`/`lenscorrection`/`vidstabtransform` | GPL (static build) | yes, already used | Good for a post stage on an already rendered shot; `perspective` is sub-pixel, `crop` steps in whole pixels |
| OpenCV (Python) | Apache-2.0 | yes | Analysis (motion trace of the reference); could warp frames too, but adds a Python runtime to the kit |
| fframes ([repo](https://github.com/dmtrKovalenko/fframes)) | MIT since 2026-09-28 | yes (Skia, Vulkan) | Can read video frames and run shaders (`ff-tracking` is a virtual-camera-filming-a-screen example), but adds a Rust toolchain with no Node API; its kinetic-title strength isn't what this needs |
| Remotion ([licence](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)) | free ≤3 employees, else company licence | yes (`renderMedia`) | Works, but it is a second browser renderer to compose a single transformed layer |
| Revideo ([docs](https://docs.re.video/renderer/renderVideo/)) | MIT | yes (`renderVideo`) | Same as Remotion without the licence question |
| Motion Canvas | MIT | no documented headless CLI ([issue](https://github.com/motion-canvas/motion-canvas/issues/1218)) | No |
| Blender (EEVEE) | GPL | yes since 3.4, needs a GPU | Heaviest: a screen in a 3D room with a tracked camera; only worth it if the reference shows the room/device around the screen in depth |
| Gyroflow | GPLv3 | CLI | No gyro data in an iPhone Camera clip |

The reference itself (`IMG_1657.mp4`, analysed 2026-10-31; work copies, contact sheets and traces in `.scratch/handheld/`):

- iPhone, portrait 2160×3840, 59.94 fps, HEVC Main 10 HLG, 156.7 s, one take with no cuts.
- It films a curved ultrawide monitor in a dark room, with the site playing in a desktop browser: browser chrome
  and the site's desktop interface in shot. It opens on the desk, tilts up to the monitor, and then stays mostly
  medium and close on the screen, pulling back to show the room every 20–50 s.
- Close up, the screen's pixel rows show as fine horizontal lines.
- Exposure is set for the screen and steady (mean luma 70–86 of 255, p10–p90).
- Camera trace: corners and pyramidal LK, `estimateAffinePartial2D` per frame, on the parts of the frame that hold
  still (top 12 % and bottom 40 %). Six frames fail; the medians are 1.2 px a frame of pan, 0.007° of roll and 0.2 %
  of zoom.
  - Shake (path minus a 0.4 s Gaussian of itself): RMS 8.7 px across, 18.8 px up and down on a 1080 px wide frame,
    0.083° of roll, 1.6 % of zoom. Over 96 % of its power is under 2 Hz and 1 % at 8–15 Hz, so the stabiliser has
    removed the tremor.
  - Moves (1 s Gaussian): pans at a median 74 px/s (p90 236), zoom at a median 7 %/s (p90 23 %/s), about 2× of zoom
    and 1.6° of roll in any 10 s window.
- Replaying the integrated similarity path on a render does not work: warping the reference by its own inverse path
  loses the monitor within seconds, because the tilt from the desk and the push-in are 3D moves with parallax.

The prototype (2026-10-31):

- 15 s of The plain from Radio RahRa's drop at 1080×1920 on a 3440×1440 screen; `render.mjs --gpu` took 84 s
  (155 ms per frame, the same as a plain shot).
- Its camera, measured from `camera()`'s own poses with the same 0.4 s high-pass, shakes 8.9 / 17.4 px, 0.082° and
  1.62 % of zoom, against the reference's 8.7 / 18.8 px, 0.083° and 1.61 %. Its moves pan at a median 36 px/s
  (p90 196) and zoom at 12.7 %/s (p90 23 %/s), so it is calmer between moves and zooms more often.
- Exposure is lifted 1.45×, giving a median luma of 64, against 75 in the reference.
- A tracker run on the rendered prototype reads higher, because there it follows the scene's own side scroll and
  lights; the poses are the measure of the camera.

## Unknown Inventory

- **Known unknown (blocks the build): what the reference looks like.** Phone camera pointed at a screen (filmed-screen
  look: perspective, bezel, moiré, glare, exposure) or the site played on the phone and filmed/recorded handheld some
  other way; framing, motion amplitude and frequency, cuts. Settled by the analysis pass, not by asking.
- **Unknown known: the bar for "the whole essence of the scene".** Likely the sense of a person standing in front of
  it, looking around: the frame moving, reframing onto the horizon light, maybe pushing in. Settled by the operator's
  reaction to the prototype next to their footage.
- **Blind spots:** shaking a 2D frame shows black borders unless it is overscanned (zoom ≥ cos θ + aspect·sin θ plus
  the largest offset); moves without motion blur look synthetic; too much 8–12 Hz jitter reads as an earthquake, not
  a phone; the site's own UI changes below 760 px wide, so any downscaled-screen composite must render the page at a
  desktop-class viewport and scale the image, not the viewport.

## Directions or Prototypes

- **O1 Camera-path transfer (recommended default).** Measure the reference's per-frame similarity transform and
  replay it on the render as a virtual camera, with overscan and a short-shutter motion blur. It copies the operator's
  actual hand instead of approximating it with noise, and it loops or time-stretches to any length.
- **O2 Procedural handheld.** fBm noise per axis with the amplitudes and spectrum measured from the reference. Use it
  for full-length renders where a replayed path would visibly repeat, or blend with O1.
- **O3 Filmed-screen composite.** If the reference films a laptop/monitor: the render on a screen-shaped quad in
  perspective, with bezel/room falloff, pixel-grid moiré, glare, exposure drift, rolling-shutter skew, all through the
  O1 camera. Only if the reference shows those artefacts.

Where: the camera pass belongs in the capture's own Chromium when re-rendering (frame-exact, sub-pixel, motion blur
from sub-steps), or as an ffmpeg post stage (`perspective` with per-frame expressions) on an already rendered shot.

Settled by the analysis: the reference is a filmed screen (O3), its shake is low-frequency (so O2's noise is
fitted to under 2 Hz, with a trace of tremor), and replaying its path (O1) was tried and rejected for drift.

## Locked Decisions

- D3: The look is O3 (filmed monitor) with O2 (fitted noise) and eased framing beats, built in the capture's own
  page (`--phone`), not as a post stage: it keeps the virtual clock, sub-pixel moves and the desktop interface for
  free. Nothing derived from the reference goes into the repo except the fitted figures in `phone.mjs`.
- D1: The reference footage, its frames and its trace stay out of git (public repo); work copies in
  `.scratch/handheld/` of the primary checkout or `/tmp`.
- D2: No new runtime in the kit unless the reference needs it: fframes, Remotion, Revideo and Blender add a toolchain
  for what a transform per frame can do. OpenCV is used for the one-off analysis only.

## Assumptions

- The reference is a single handheld take, not an edited sequence: confirmed.
- A 3440×1440 screen is close enough to the reference's monitor; its close-ups (z ≈ 5) upscale the site about 1.6×,
  which reads like a phone close to a screen.

## Residual Unknowns

- The operator's verdict on the prototype: whether this is the essence they meant, and whether the room needs to look
  like a real room (a photo plate) before the full-length Radio RahRa render. Revisit when they have watched it.
- Whether the same treatment suits the multi-scene cuts (Halloween, Big Brother); beats per row already allow it.

## Scope

IN: style analysis of the reference; one ~15 s prototype of The plain with Radio RahRa at 1080×1920 in that style; a
reusable camera stage in `scripts/demo/`; a comparison page. OUT: the full-length re-render (waits for the
operator's verdict); site changes.

## Plan Handoff

No separate plan: the build is small and done. To render the full Radio RahRa in this look, lengthen the row of
`radio-rahra-phone.tsv` to 145.7 s and write beats for the whole track (a pull back every 20–50 s, as in the
reference), then `render.mjs … --gpu` (about 12 min) and `assemble.mjs`.
