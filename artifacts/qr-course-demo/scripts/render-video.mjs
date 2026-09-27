import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const run = promisify(execFile);
const root = resolve('artifacts/qr-course-demo');
const footage = `${root}/recordings/algebra-app-footage.webm`;
const { markers } = JSON.parse(await readFile(`${root}/recordings/algebra-markers.json`, 'utf8'));
const out = `${root}/public/algebra-1-app-walkthrough.mp4`;
const poster = `${root}/public/algebra-1-poster.jpg`;
const trimStart = 1.2;
const { stdout: durationText } = await run('ffprobe', [
  '-v', 'error', '-show_entries', 'format=duration',
  '-of', 'default=noprint_wrappers=1:nokey=1', footage,
]);
const videoDuration = Number(durationText.trim()) - trimStart;
const stages = ['landing', 'dashboard', 'week', 'lecture', 'tutor', 'homework'];
const offsets = [0.2, 0.25, 0.3, 0.35, 0.4, 0.4];

// The only video source is the continuous, checked Playwright capture.
// The only audio sources are the six spoken narration clips; no music or overlays.
const audio = stages.map((_, i) => `${root}/public/audio/voice-0${i + 1}.mp3`);
const filters = [
  `[0:v]trim=start=${trimStart},setpts=PTS-STARTPTS,format=yuv420p[v]`,
  ...stages.map((stage, i) => {
    const delay = Math.round(Math.max(0, markers[stage] - trimStart + offsets[i]) * 1000);
    return `[${i + 1}:a]aresample=48000,adelay=${delay}:all=1[a${i + 1}]`;
  }),
  `${stages.map((_, i) => `[a${i + 1}]`).join('')}amix=inputs=6:duration=longest:normalize=0,apad[a]`,
].join(';');

await run('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-i', footage, ...audio.flatMap(file => ['-i', file]),
  '-filter_complex', filters,
  '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-r', '25',
  '-c:a', 'aac', '-b:a', '160k',
  '-movflags', '+faststart', '-t', videoDuration.toFixed(3), out,
], { maxBuffer: 1024 * 1024 });

await run('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-ss', '2', '-i', out, '-frames:v', '1', poster,
]);
console.log(`Rendered ${out} with uninterrupted app footage and narration only.`);