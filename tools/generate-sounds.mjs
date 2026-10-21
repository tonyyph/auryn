// Synthesises Auryn's sound effects as 16-bit mono WAV files.
// Every sound is generated here from sine partials and envelopes: no samples, no third-party
// audio, so the assets are original to this project. Re-run with `pnpm sounds`.
import fs from 'node:fs';
import path from 'node:path';

const RATE = 44100;
const OUT = path.resolve(import.meta.dirname, '../assets/sounds');
fs.mkdirSync(OUT, { recursive: true });

/** A soft bell: a few inharmonic-ish partials with fast attack and exponential decay. */
function bell(freq, { dur = 0.32, gain = 0.5, partials = [[1, 1], [2.01, 0.28], [3.02, 0.08], [4.2, 0.03]], decay = 9, attack = 0.004 } = {}) {
  const n = Math.floor(dur * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / attack) * Math.exp(-decay * t);
    let s = 0;
    for (const [mul, amp] of partials) s += amp * Math.sin(2 * Math.PI * freq * mul * t) * Math.exp(-decay * (mul - 1) * 0.35 * t);
    out[i] = s * env * gain;
  }
  return out;
}

function mix(length, layers) {
  const out = new Float32Array(Math.floor(length * RATE));
  for (const [offset, buf] of layers) {
    const start = Math.floor(offset * RATE);
    for (let i = 0; i < buf.length && start + i < out.length; i++) out[start + i] += buf[i];
  }
  return out;
}

/** Gentle fade-out at the very end so no sound ends on a click. */
function finish(buf) {
  const fade = Math.floor(0.012 * RATE);
  let peak = 0;
  for (const s of buf) peak = Math.max(peak, Math.abs(s));
  const norm = peak > 0.89 ? 0.89 / peak : 1;
  for (let i = 0; i < buf.length; i++) {
    const f = i > buf.length - fade ? (buf.length - i) / fade : 1;
    buf[i] *= norm * f;
  }
  return buf;
}

function writeWav(name, buf) {
  const data = Buffer.alloc(buf.length * 2);
  buf.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, name), Buffer.concat([h, data]));
  console.log('wrote', name, `${(buf.length / RATE).toFixed(2)}s`);
}

// Slide: a very short, low, muted "tock" — felt more than heard.
{
  const n = Math.floor(0.07 * RATE);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = 300 - 900 * t;
    buf[i] = Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.002) * Math.exp(-60 * t) * 0.32;
  }
  writeWav('slide.wav', finish(buf));
}

// Merges: crystalline bells rising along a pentatonic scale as tiles grow.
const pentatonic = [659.25, 739.99, 880.0, 987.77, 1108.73]; // E5 F#5 A5 B5 C#6
pentatonic.forEach((f, i) => {
  const b = mix(0.36, [
    [0, bell(f, { dur: 0.36, gain: 0.42 })],
    [0.004, bell(f * 1.5, { dur: 0.3, gain: 0.09, decay: 12 })],
  ]);
  writeWav(`merge${i + 1}.wav`, finish(b));
});

// Milestone: a slow, open arpeggio (A major add9) with a soft shimmer tail.
{
  const notes = [440, 554.37, 659.25, 987.77, 1318.51];
  const layers = notes.map((f, i) => [i * 0.085, bell(f, { dur: 1.3, gain: 0.3, decay: 3.2 })]);
  layers.push([0.36, bell(1760, { dur: 0.9, gain: 0.06, decay: 4 })]);
  writeWav('milestone.wav', finish(mix(1.6, layers)));
}

// Game over: two calm, descending low tones. Resolved, not sad.
{
  const b = mix(1.1, [
    [0, bell(523.25, { dur: 0.9, gain: 0.3, decay: 4 })],
    [0.16, bell(392.0, { dur: 0.9, gain: 0.3, decay: 3.6 })],
  ]);
  writeWav('gameover.wav', finish(b));
}

// UI: a tiny soft tick for primary buttons.
writeWav('tap.wav', finish(bell(1318.51, { dur: 0.08, gain: 0.16, decay: 40, partials: [[1, 1], [2, 0.15]] })));
