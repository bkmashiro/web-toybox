import type { SoundConfig, SoundLayerConfig, TriggerOptions } from './config';
import type { LazyAudioSession } from './session';

const finiteFactor = (value: number | undefined): number => Number.isFinite(value) ? Math.max(0, value as number) : 1;
const positive = (value: number | undefined, fallback: number): number => Number.isFinite(value) && (value ?? 0) > 0 ? value as number : fallback;

function renderTone(
  session: LazyAudioSession,
  layer: Extract<SoundLayerConfig, { kind: 'tone' }>,
  options: TriggerOptions,
): boolean {
  const context = session.runningContext;
  const gainScale = finiteFactor(options.gain);
  const pitchScale = finiteFactor(options.pitch);
  const durationScale = finiteFactor(options.duration);
  if (!context || session.volume <= 0 || gainScale <= 0 || pitchScale <= 0 || durationScale <= 0) return false;
  const frequency = layer.frequency * pitchScale;
  if (!(frequency > 0)) return false;
  const duration = Math.min(4, positive(layer.duration, 0.08) * durationScale);
  const pitchDuration = Math.min(4, positive(layer.pitchDuration, positive(layer.duration, 0.08)) * durationScale);
  const level = Math.max(0, layer.gain ?? 0.12) * gainScale * session.volume;
  if (level <= 0) return false;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = layer.wave ?? 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  if ((layer.endFrequency ?? 0) > 0) {
    oscillator.frequency.exponentialRampToValueAtTime((layer.endFrequency as number) * pitchScale, now + pitchDuration);
  }
  gain.gain.setValueAtTime(Math.max(0.0001, level), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  if (layer.filter && layer.filter.frequency > 0) {
    const filter = context.createBiquadFilter();
    filter.type = layer.filter.type ?? 'lowpass';
    const tracking = Number.isFinite(layer.filter.pitchTracking) ? layer.filter.pitchTracking as number : 0;
    filter.frequency.setValueAtTime(Math.max(1, layer.filter.frequency * (1 + (pitchScale - 1) * tracking)), now);
    if (Number.isFinite(layer.filter.q)) filter.Q.setValueAtTime(layer.filter.q as number, now);
    oscillator.connect(filter).connect(gain).connect(context.destination);
  } else {
    oscillator.connect(gain).connect(context.destination);
  }
  oscillator.start(now);
  oscillator.stop(now + duration + 0.005);
  return true;
}

function renderNoise(
  session: LazyAudioSession,
  layer: Extract<SoundLayerConfig, { kind: 'noise' }>,
  options: TriggerOptions,
): boolean {
  const context = session.runningContext;
  const gainScale = finiteFactor(options.gain);
  const pitchScale = finiteFactor(options.pitch);
  const durationScale = finiteFactor(options.duration);
  if (!context || session.volume <= 0 || gainScale <= 0 || pitchScale <= 0 || durationScale <= 0) return false;
  const duration = Math.min(4, positive(layer.duration, 0.05) * durationScale);
  const level = Math.max(0, layer.gain ?? 0.08) * gainScale * session.volume;
  if (level <= 0) return false;
  const sampleRate = Number.isFinite(context.sampleRate) && context.sampleRate > 0 ? context.sampleRate : 44_100;
  const buffer = context.createBuffer(1, Math.max(1, Math.round(sampleRate * duration)), sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;

  const source = context.createBufferSource();
  const gain = context.createGain();
  const now = context.currentTime;
  source.buffer = buffer;
  gain.gain.setValueAtTime(Math.max(0.0001, level), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  if (layer.filter && layer.filter.frequency > 0) {
    const filter = context.createBiquadFilter();
    filter.type = layer.filter.type ?? 'lowpass';
    const tracking = Number.isFinite(layer.filter.pitchTracking) ? layer.filter.pitchTracking as number : 0;
    filter.frequency.setValueAtTime(Math.max(1, layer.filter.frequency * (1 + (pitchScale - 1) * tracking)), now);
    if (Number.isFinite(layer.filter.q)) filter.Q.setValueAtTime(layer.filter.q as number, now);
    source.connect(filter).connect(gain).connect(context.destination);
  } else {
    source.connect(gain).connect(context.destination);
  }
  source.start(now);
  source.stop(now + duration + 0.005);
  return true;
}

export function renderSound(
  session: LazyAudioSession,
  sound: Readonly<SoundConfig>,
  options: TriggerOptions = {},
): boolean {
  let played = false;
  for (const layer of sound.layers) {
    const result = layer.kind === 'tone'
      ? renderTone(session, layer, options)
      : renderNoise(session, layer, options);
    played = result || played;
  }
  return played;
}
