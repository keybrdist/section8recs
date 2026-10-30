#!/bin/bash
# Cut a demo video from the rendered shots: a title card over the build-up of the first shot's track, each shot cut on
# its drop, and an end card while the last track fades out. With 7 shots of 5.9 s that is 1.5 + 41.3 + 2.2 = 45 s.
#   scripts/demo/assemble.sh scripts/demo/shots/halloween-2026.tsv <work-dir> <out.mp4>
# Reads <work-dir>/shots and mp3 (render.sh) and <work-dir>/cards (made here with cards.mjs when missing).
# Out: H.264 1080p30 capped at 16 Mbps (the site's grain is costly to encode), AAC 320 kbps, two-pass loudnorm to
# -14 LUFS with a true peak of -1.5 dBTP. SHOT, INTRO and END override the lengths; FFMPEG overrides ffmpeg.
set -euo pipefail
TABLE=${1:?usage: assemble.sh <shots.tsv> <work-dir> <out.mp4>}; WORK=${2:?}; OUT=${3:?}
HERE=$(cd "$(dirname "$0")" && pwd); FF=${FFMPEG:-ffmpeg}; C=$WORK/cards; A=$WORK/asm
SHOT=${SHOT:-5.9}; INTRO=${INTRO:-1.5}; END=${END:-2.2}; GRAIN="noise=alls=7:allf=t"
fr(){ awk "BEGIN{printf \"%d\", $1*30+.5}"; }; calc(){ awk "BEGIN{printf \"%.3f\", $1}"; }
mkdir -p "$A"; [ -s "$C/end-nocur.png" ] || node "$HERE/cards.mjs" "$C"
mapfile -t ROWS < <(grep -v '^#' "$TABLE"); N=${#ROWS[@]}
# video, cut by frame count so each cut lands on its drop
args=(-loop 1 -framerate 30 -t 3 -i "$C/intro.png")
fc="[0:v]trim=end_frame=$(fr $INTRO),setpts=PTS-STARTPTS,format=yuv420p,$GRAIN,fade=in:0:12[v0];"; cat="[v0]"
for i in "${!ROWS[@]}"; do IFS=$'\t' read -r name _ <<<"${ROWS[$i]}"; k=$((i+1)); args+=(-i "$WORK/shots/$name.mp4")
  fc+="[$k:v]trim=end_frame=$(fr $SHOT),setpts=PTS-STARTPTS,format=yuv420p[v$k];"; cat+="[v$k]"; done
args+=(-loop 1 -framerate 30 -t 4 -i "$C/end-nocur.png" -loop 1 -framerate 30 -t 4 -i "$C/end.png")
fc+="[$((N+1)):v][$((N+2)):v]overlay=enable='lt(mod(t\,1.06)\,0.53)',trim=end_frame=$(fr $END),setpts=PTS-STARTPTS,format=yuv420p,$GRAIN,fade=in:0:6,fade=out:st=$(calc "$END-.6"):d=0.6[ve];"
fc+="${cat}[ve]concat=n=$((N+2)):v=1:a=0,fps=30[v]"
"$FF" -v error -y "${args[@]}" -filter_complex "$fc" -map "[v]" -c:v libx264 -preset medium -crf 12 -pix_fmt yuv420p "$A/video.mp4"
# audio: the first track starts INTRO early under the title, the last runs on under the end card; 10 ms edges at the cuts
a=(); afc=""; acat=""
for i in "${!ROWS[@]}"; do IFS=$'\t' read -r _ _ _ file start _ <<<"${ROWS[$i]}"; st=$start; d=$SHOT
  [ $i -eq 0 ] && st=$(calc "$start-$INTRO") && d=$(calc "$SHOT+$INTRO")
  [ $i -eq $((N-1)) ] && d=$(calc "$d+$END")
  fi="afade=in:d=0.01"; [ $i -eq 0 ] && fi="afade=in:d=0.4"
  fo="afade=out:st=$(calc "$d-.01"):d=0.01"; [ $i -eq $((N-1)) ] && fo="afade=out:st=$(calc "$d-1.6"):d=1.6"
  a+=(-ss "$st" -t "$d" -i "$WORK/mp3/$file")
  afc+="[$i:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=$d,asetpts=PTS-STARTPTS,$fi,$fo[a$i];"; acat+="[a$i]"; done
"$FF" -v error -y "${a[@]}" -filter_complex "${afc}${acat}concat=n=$N:v=0:a=1[a]" -map "[a]" -c:a pcm_f32le "$A/audio.wav"
# loudness: measure, then apply linearly
J=$("$FF" -hide_banner -i "$A/audio.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
"$FF" -v error -y -i "$A/audio.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_f32le "$A/audio-norm.wav"
"$FF" -v error -y -i "$A/video.mp4" -i "$A/audio-norm.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -maxrate 16M -bufsize 32M \
  -profile:v high -pix_fmt yuv420p -r 30 -c:a aac -b:a 320k -ar 48000 -movflags +faststart -t "$(calc "$INTRO+$N*$SHOT+$END")" "$OUT"
echo "wrote $OUT"
