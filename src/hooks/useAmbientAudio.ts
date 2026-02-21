/**
 * useAmbientAudio -- Wind + wind chimes for The Pattern Break
 *
 * Two layers:
 * 1. Shaped noise wind (bandpass-filtered white noise with gust modulation)
 * 2. Stochastic wind chimes (sine oscillators with exponential decay,
 *    triggered at random intervals -- like metal tubes ringing in the breeze)
 *
 * Scene I   (Gravity Well):  Tight wind, muted low chimes -- stuck
 * Scene II  (The Shatter):   Explosive gust, bright scattered chimes -- breakout
 * Scene III (The Lattice):   Steady crosswind, crystalline chimes -- building
 * Scene IV  (The Forge):     Hot updraft, deep resonant chimes -- grounded
 * Scene V   (Constellation): Thin high wind, ethereal high chimes -- arrival
 */

import { useEffect, useRef, useCallback, useState } from "react";

// ============================================================================
// WIND CONFIG
// ============================================================================

interface WindConfig {
  bandFreq: number;
  bandQ: number;
  bandGain: number;
  whistleFreq: number;
  whistleQ: number;
  whistleGain: number;
  rumbleFreq: number;
  rumbleGain: number;
  gustRate: number;
  gustDepth: number;
  gustShape: number;
  reverbWet: number;
}

const WIND_CONFIGS: WindConfig[] = [
  // I -- Gravity Well
  {
    bandFreq: 350, bandQ: 1.8, bandGain: 0.05,
    whistleFreq: 800, whistleQ: 12, whistleGain: 0.012,
    rumbleFreq: 80, rumbleGain: 0.025,
    gustRate: 0.15, gustDepth: 0.15, gustShape: 60, reverbWet: 0.2,
  },
  // II -- The Shatter
  {
    bandFreq: 1200, bandQ: 0.5, bandGain: 0.06,
    whistleFreq: 3200, whistleQ: 8, whistleGain: 0.015,
    rumbleFreq: 120, rumbleGain: 0.03,
    gustRate: 0.35, gustDepth: 0.25, gustShape: 200, reverbWet: 0.45,
  },
  // III -- The Lattice
  {
    bandFreq: 600, bandQ: 1.2, bandGain: 0.04,
    whistleFreq: 1800, whistleQ: 15, whistleGain: 0.01,
    rumbleFreq: 90, rumbleGain: 0.018,
    gustRate: 0.22, gustDepth: 0.12, gustShape: 80, reverbWet: 0.3,
  },
  // IV -- The Forge
  {
    bandFreq: 450, bandQ: 1.0, bandGain: 0.055,
    whistleFreq: 2400, whistleQ: 18, whistleGain: 0.014,
    rumbleFreq: 60, rumbleGain: 0.035,
    gustRate: 0.18, gustDepth: 0.14, gustShape: 50, reverbWet: 0.25,
  },
  // V -- Constellation
  {
    bandFreq: 2000, bandQ: 0.8, bandGain: 0.035,
    whistleFreq: 4500, whistleQ: 20, whistleGain: 0.008,
    rumbleFreq: 100, rumbleGain: 0.008,
    gustRate: 0.08, gustDepth: 0.2, gustShape: 300, reverbWet: 0.55,
  },
];

// ============================================================================
// CHIME CONFIG -- per-scene tuning and behavior
// ============================================================================

interface ChimeConfig {
  // Pentatonic-ish pitch set (Hz) -- each scene has its own palette
  pitches: number[];
  // Volume of each chime strike
  gain: number;
  // Decay time in seconds (how long the ring lasts)
  decay: number;
  // Average interval between chime strikes (seconds)
  intervalMin: number;
  intervalMax: number;
  // How many simultaneous chimes can ring at once per trigger
  clusterMax: number;
}

const CHIME_CONFIGS: ChimeConfig[] = [
  // I -- Gravity Well: Low, muted, sparse -- trapped
  {
    pitches: [220, 261.6, 293.7, 349.2, 392],  // A3-G4 range, minor feel
    gain: 0.012,
    decay: 2.5,
    intervalMin: 4,
    intervalMax: 8,
    clusterMax: 1,
  },
  // II -- The Shatter: Bright, scattered, energetic
  {
    pitches: [523.3, 659.3, 784, 880, 1047],  // C5-C6, bright major
    gain: 0.018,
    decay: 1.8,
    intervalMin: 1.5,
    intervalMax: 4,
    clusterMax: 3,
  },
  // III -- The Lattice: Crystalline, steady, building
  {
    pitches: [392, 440, 523.3, 587.3, 659.3],  // G4-E5, pentatonic
    gain: 0.015,
    decay: 2.2,
    intervalMin: 2.5,
    intervalMax: 5,
    clusterMax: 2,
  },
  // IV -- The Forge: Deep, resonant, warm
  {
    pitches: [196, 220, 261.6, 293.7, 330],  // G3-E4, warm low register
    gain: 0.014,
    decay: 3.0,
    intervalMin: 3,
    intervalMax: 6,
    clusterMax: 2,
  },
  // V -- Constellation: Ethereal, high, celestial
  {
    pitches: [784, 880, 1047, 1175, 1319],  // G5-E6, high sparkle
    gain: 0.01,
    decay: 3.5,
    intervalMin: 2,
    intervalMax: 5,
    clusterMax: 2,
  },
];

// ============================================================================
// SCENE BLEND
// ============================================================================

function getSceneBlend(progress: number): { sceneA: number; sceneB: number; blend: number; masterGain: number } {
  if (progress < 0.03) return { sceneA: 0, sceneB: 0, blend: 0, masterGain: Math.min(1, progress / 0.03) * 0.5 };

  const scenes = [
    { start: 0.03, end: 0.18 },
    { start: 0.20, end: 0.35 },
    { start: 0.37, end: 0.52 },
    { start: 0.54, end: 0.69 },
    { start: 0.71, end: 0.86 },
  ];
  const transitions = [
    { start: 0.18, end: 0.20, from: 0, to: 1 },
    { start: 0.35, end: 0.37, from: 1, to: 2 },
    { start: 0.52, end: 0.54, from: 2, to: 3 },
    { start: 0.69, end: 0.71, from: 3, to: 4 },
  ];

  for (const t of transitions) {
    if (progress >= t.start && progress <= t.end) {
      return { sceneA: t.from, sceneB: t.to, blend: (progress - t.start) / (t.end - t.start), masterGain: 1 };
    }
  }
  for (let i = 0; i < scenes.length; i++) {
    if (progress >= scenes[i].start && progress <= scenes[i].end) {
      return { sceneA: i, sceneB: i, blend: 0, masterGain: 1 };
    }
  }
  if (progress > 0.86) return { sceneA: 4, sceneB: 4, blend: 0, masterGain: 1 - Math.min(1, (progress - 0.86) / 0.12) };
  return { sceneA: 0, sceneB: 0, blend: 0, masterGain: 0 };
}

function lerpWindConfig(a: WindConfig, b: WindConfig, t: number): WindConfig {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    bandFreq: lerp(a.bandFreq, b.bandFreq),
    bandQ: lerp(a.bandQ, b.bandQ),
    bandGain: lerp(a.bandGain, b.bandGain),
    whistleFreq: lerp(a.whistleFreq, b.whistleFreq),
    whistleQ: lerp(a.whistleQ, b.whistleQ),
    whistleGain: lerp(a.whistleGain, b.whistleGain),
    rumbleFreq: lerp(a.rumbleFreq, b.rumbleFreq),
    rumbleGain: lerp(a.rumbleGain, b.rumbleGain),
    gustRate: lerp(a.gustRate, b.gustRate),
    gustDepth: lerp(a.gustDepth, b.gustDepth),
    gustShape: lerp(a.gustShape, b.gustShape),
    reverbWet: lerp(a.reverbWet, b.reverbWet),
  };
}

// ============================================================================
// AUDIO NODES
// ============================================================================

interface WindNodes {
  ctx: AudioContext;
  noiseSource: AudioBufferSourceNode;
  bandFilter: BiquadFilterNode;
  bandGain: GainNode;
  whistleFilter: BiquadFilterNode;
  whistleGain: GainNode;
  rumbleFilter: BiquadFilterNode;
  rumbleGain: GainNode;
  gustLfo: OscillatorNode;
  gustLfoGain: GainNode;
  gustFilterLfo: OscillatorNode;
  gustFilterLfoGain: GainNode;
  gustLfo2: OscillatorNode;
  gustLfo2Gain: GainNode;
  convolver: ConvolverNode;
  reverbGain: GainNode;
  dryGain: GainNode;
  masterGain: GainNode;
  // Chime reverb (separate, longer tail)
  chimeReverb: ConvolverNode;
  chimeReverbGain: GainNode;
  chimeDryGain: GainNode;
  chimeBus: GainNode;
}

// ============================================================================
// CHIME STRIKE -- creates a single decaying sine tone
// ============================================================================

function strikeChime(
  ctx: AudioContext,
  destination: GainNode,
  freq: number,
  gain: number,
  decay: number,
) {
  const now = ctx.currentTime;

  // Sine oscillator for the fundamental
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  // Slight random detune for organic feel (+/- 5 cents)
  osc.detune.value = (Math.random() - 0.5) * 10;

  // Second partial (octave + fifth above) for metallic shimmer
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = freq * 2.98; // slightly inharmonic for bell-like quality
  osc2.detune.value = (Math.random() - 0.5) * 15;

  // Gain envelopes
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(gain, now);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  const osc2Gain = ctx.createGain();
  osc2Gain.gain.setValueAtTime(gain * 0.3, now);
  osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.6);

  // Connect
  osc.connect(oscGain);
  osc2.connect(osc2Gain);
  oscGain.connect(destination);
  osc2Gain.connect(destination);

  // Start and auto-stop
  osc.start(now);
  osc2.start(now);
  osc.stop(now + decay + 0.1);
  osc2.stop(now + decay * 0.6 + 0.1);
}

// ============================================================================
// HOOK
// ============================================================================

export function useAmbientAudio(progress: number) {
  const nodesRef = useRef<WindNodes | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const chimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSceneRef = useRef(0);
  const masterLevelRef = useRef(0);

  const initAudio = useCallback(() => {
    if (nodesRef.current) return;
    try {
      const ctx = new AudioContext();

      // --- Noise source (4s looped buffer) ---
      const noiseBuf = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = noiseBuf.getChannelData(ch);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      noiseSource.loop = true;

      // --- Primary wind band ---
      const bandFilter = ctx.createBiquadFilter();
      bandFilter.type = "bandpass";
      bandFilter.frequency.value = 350;
      bandFilter.Q.value = 1.8;
      const bandGain = ctx.createGain();
      bandGain.gain.value = 0;

      // --- Whistle resonance ---
      const whistleFilter = ctx.createBiquadFilter();
      whistleFilter.type = "bandpass";
      whistleFilter.frequency.value = 800;
      whistleFilter.Q.value = 12;
      const whistleGain = ctx.createGain();
      whistleGain.gain.value = 0;

      // --- Low rumble ---
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = "lowpass";
      rumbleFilter.frequency.value = 80;
      rumbleFilter.Q.value = 1.0;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0;

      // --- Connect noise ---
      noiseSource.connect(bandFilter);
      noiseSource.connect(whistleFilter);
      noiseSource.connect(rumbleFilter);
      bandFilter.connect(bandGain);
      whistleFilter.connect(whistleGain);
      rumbleFilter.connect(rumbleGain);

      // --- Gust LFOs ---
      const gustLfo = ctx.createOscillator();
      gustLfo.type = "sine";
      gustLfo.frequency.value = 0.15;
      const gustLfoGain = ctx.createGain();
      gustLfoGain.gain.value = 0.15;

      const gustFilterLfo = ctx.createOscillator();
      gustFilterLfo.type = "sine";
      gustFilterLfo.frequency.value = 0.07;
      const gustFilterLfoGain = ctx.createGain();
      gustFilterLfoGain.gain.value = 60;

      const gustLfo2 = ctx.createOscillator();
      gustLfo2.type = "sine";
      gustLfo2.frequency.value = 0.04;
      const gustLfo2Gain = ctx.createGain();
      gustLfo2Gain.gain.value = 100;

      gustLfo.connect(gustLfoGain);
      gustFilterLfo.connect(gustFilterLfoGain);
      gustFilterLfoGain.connect(bandFilter.frequency);
      gustLfo2.connect(gustLfo2Gain);
      gustLfo2Gain.connect(whistleFilter.frequency);

      gustLfo.start();
      gustFilterLfo.start();
      gustLfo2.start();
      noiseSource.start();

      // --- Wind reverb ---
      const convolver = ctx.createConvolver();
      const reverbLen = ctx.sampleRate * 4;
      const reverbBuf = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = reverbBuf.getChannelData(ch);
        for (let i = 0; i < reverbLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.0);
        }
      }
      convolver.buffer = reverbBuf;

      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.3;
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.7;

      // --- Chime reverb (longer, brighter tail) ---
      const chimeReverb = ctx.createConvolver();
      const chimeRevLen = ctx.sampleRate * 5;
      const chimeRevBuf = ctx.createBuffer(2, chimeRevLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = chimeRevBuf.getChannelData(ch);
        for (let i = 0; i < chimeRevLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / chimeRevLen, 1.5);
        }
      }
      chimeReverb.buffer = chimeRevBuf;

      const chimeReverbGain = ctx.createGain();
      chimeReverbGain.gain.value = 0.5;
      const chimeDryGain = ctx.createGain();
      chimeDryGain.gain.value = 0.5;

      // Chime bus -- chimes connect here
      const chimeBus = ctx.createGain();
      chimeBus.gain.value = 1;

      // --- Master ---
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;

      gustLfoGain.connect(masterGain.gain);

      // Wind mix bus
      const windMixBus = ctx.createGain();
      windMixBus.gain.value = 1;
      bandGain.connect(windMixBus);
      whistleGain.connect(windMixBus);
      rumbleGain.connect(windMixBus);

      windMixBus.connect(dryGain);
      windMixBus.connect(convolver);
      convolver.connect(reverbGain);
      dryGain.connect(masterGain);
      reverbGain.connect(masterGain);

      // Chime routing: chimeBus -> dry + reverb -> master
      chimeBus.connect(chimeDryGain);
      chimeBus.connect(chimeReverb);
      chimeReverb.connect(chimeReverbGain);
      chimeDryGain.connect(masterGain);
      chimeReverbGain.connect(masterGain);

      masterGain.connect(ctx.destination);

      nodesRef.current = {
        ctx, noiseSource,
        bandFilter, bandGain,
        whistleFilter, whistleGain,
        rumbleFilter, rumbleGain,
        gustLfo, gustLfoGain,
        gustFilterLfo, gustFilterLfoGain,
        gustLfo2, gustLfo2Gain,
        convolver, reverbGain, dryGain,
        masterGain,
        chimeReverb, chimeReverbGain, chimeDryGain, chimeBus,
      };
    } catch (e) {
      console.warn("Web Audio unavailable:", e);
    }
  }, []);

  // --- Chime scheduler ---
  const scheduleNextChime = useCallback(() => {
    if (!nodesRef.current) return;
    const scene = currentSceneRef.current;
    const masterLevel = masterLevelRef.current;
    const config = CHIME_CONFIGS[scene];
    if (!config || masterLevel < 0.05) {
      // Reschedule check
      chimeTimerRef.current = setTimeout(scheduleNextChime, 2000);
      return;
    }

    // Strike chimes
    const count = 1 + Math.floor(Math.random() * config.clusterMax);
    for (let i = 0; i < count; i++) {
      const delay = i * (0.08 + Math.random() * 0.15); // slight stagger within cluster
      setTimeout(() => {
        if (!nodesRef.current) return;
        const pitch = config.pitches[Math.floor(Math.random() * config.pitches.length)];
        strikeChime(
          nodesRef.current.ctx,
          nodesRef.current.chimeBus,
          pitch,
          config.gain * masterLevel,
          config.decay,
        );
      }, delay * 1000);
    }

    // Schedule next
    const interval = config.intervalMin + Math.random() * (config.intervalMax - config.intervalMin);
    chimeTimerRef.current = setTimeout(scheduleNextChime, interval * 1000);
  }, []);

  const startAudio = useCallback(() => {
    if (!nodesRef.current) initAudio();
    const nodes = nodesRef.current;
    if (!nodes) return;
    if (nodes.ctx.state === "suspended") nodes.ctx.resume();
    const now = nodes.ctx.currentTime;
    nodes.masterGain.gain.cancelScheduledValues(now);
    nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, now);
    nodes.masterGain.gain.linearRampToValueAtTime(1, now + 2.0);
    setIsPlaying(true);
    // Start chime scheduler
    if (chimeTimerRef.current) clearTimeout(chimeTimerRef.current);
    chimeTimerRef.current = setTimeout(scheduleNextChime, 1500 + Math.random() * 2000);
  }, [initAudio, scheduleNextChime]);

  const stopAudio = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    const now = nodes.ctx.currentTime;
    nodes.masterGain.gain.cancelScheduledValues(now);
    nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, now);
    nodes.masterGain.gain.linearRampToValueAtTime(0, now + 1.5);
    setIsPlaying(false);
    if (chimeTimerRef.current) { clearTimeout(chimeTimerRef.current); chimeTimerRef.current = null; }
  }, []);

  const toggleAudio = useCallback(() => {
    isPlaying ? stopAudio() : startAudio();
  }, [isPlaying, startAudio, stopAudio]);

  // --- Update wind + track scene for chimes ---
  useEffect(() => {
    const { sceneA, sceneB, blend, masterGain: masterLevel } = getSceneBlend(progress);
    // Update refs for chime scheduler
    currentSceneRef.current = blend > 0.5 ? sceneB : sceneA;
    masterLevelRef.current = masterLevel;

    if (!nodesRef.current || !isPlaying) return;
    const nodes = nodesRef.current;
    const now = nodes.ctx.currentTime;
    const ramp = 0.25;

    const config = blend > 0.001
      ? lerpWindConfig(WIND_CONFIGS[sceneA], WIND_CONFIGS[sceneB], blend)
      : WIND_CONFIGS[sceneA];

    // Primary wind band
    nodes.bandFilter.frequency.cancelScheduledValues(now);
    nodes.bandFilter.frequency.setValueAtTime(nodes.bandFilter.frequency.value, now);
    nodes.bandFilter.frequency.linearRampToValueAtTime(config.bandFreq, now + ramp);
    nodes.bandFilter.Q.cancelScheduledValues(now);
    nodes.bandFilter.Q.setValueAtTime(nodes.bandFilter.Q.value, now);
    nodes.bandFilter.Q.linearRampToValueAtTime(config.bandQ, now + ramp);
    nodes.bandGain.gain.cancelScheduledValues(now);
    nodes.bandGain.gain.setValueAtTime(nodes.bandGain.gain.value, now);
    nodes.bandGain.gain.linearRampToValueAtTime(config.bandGain * masterLevel, now + ramp);

    // Whistle
    nodes.whistleFilter.frequency.cancelScheduledValues(now);
    nodes.whistleFilter.frequency.setValueAtTime(nodes.whistleFilter.frequency.value, now);
    nodes.whistleFilter.frequency.linearRampToValueAtTime(config.whistleFreq, now + ramp);
    nodes.whistleFilter.Q.cancelScheduledValues(now);
    nodes.whistleFilter.Q.setValueAtTime(nodes.whistleFilter.Q.value, now);
    nodes.whistleFilter.Q.linearRampToValueAtTime(config.whistleQ, now + ramp);
    nodes.whistleGain.gain.cancelScheduledValues(now);
    nodes.whistleGain.gain.setValueAtTime(nodes.whistleGain.gain.value, now);
    nodes.whistleGain.gain.linearRampToValueAtTime(config.whistleGain * masterLevel, now + ramp);

    // Rumble
    nodes.rumbleFilter.frequency.cancelScheduledValues(now);
    nodes.rumbleFilter.frequency.setValueAtTime(nodes.rumbleFilter.frequency.value, now);
    nodes.rumbleFilter.frequency.linearRampToValueAtTime(config.rumbleFreq, now + ramp);
    nodes.rumbleGain.gain.cancelScheduledValues(now);
    nodes.rumbleGain.gain.setValueAtTime(nodes.rumbleGain.gain.value, now);
    nodes.rumbleGain.gain.linearRampToValueAtTime(config.rumbleGain * masterLevel, now + ramp);

    // Gust modulation
    nodes.gustLfo.frequency.cancelScheduledValues(now);
    nodes.gustLfo.frequency.setValueAtTime(nodes.gustLfo.frequency.value, now);
    nodes.gustLfo.frequency.linearRampToValueAtTime(config.gustRate, now + ramp);
    nodes.gustLfoGain.gain.cancelScheduledValues(now);
    nodes.gustLfoGain.gain.setValueAtTime(nodes.gustLfoGain.gain.value, now);
    nodes.gustLfoGain.gain.linearRampToValueAtTime(config.gustDepth * masterLevel, now + ramp);

    // Filter frequency modulation
    nodes.gustFilterLfoGain.gain.cancelScheduledValues(now);
    nodes.gustFilterLfoGain.gain.setValueAtTime(nodes.gustFilterLfoGain.gain.value, now);
    nodes.gustFilterLfoGain.gain.linearRampToValueAtTime(config.gustShape, now + ramp);

    // Reverb mix
    nodes.reverbGain.gain.cancelScheduledValues(now);
    nodes.reverbGain.gain.setValueAtTime(nodes.reverbGain.gain.value, now);
    nodes.reverbGain.gain.linearRampToValueAtTime(config.reverbWet, now + ramp);
    nodes.dryGain.gain.cancelScheduledValues(now);
    nodes.dryGain.gain.setValueAtTime(nodes.dryGain.gain.value, now);
    nodes.dryGain.gain.linearRampToValueAtTime(1 - config.reverbWet, now + ramp);
  }, [progress, isPlaying]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (chimeTimerRef.current) clearTimeout(chimeTimerRef.current);
      if (nodesRef.current) {
        try { nodesRef.current.noiseSource.stop(); } catch {}
        try { nodesRef.current.gustLfo.stop(); } catch {}
        try { nodesRef.current.gustFilterLfo.stop(); } catch {}
        try { nodesRef.current.gustLfo2.stop(); } catch {}
        try { nodesRef.current.ctx.close(); } catch {}
        nodesRef.current = null;
      }
    };
  }, []);

  return { isPlaying, toggleAudio, startAudio, stopAudio };
}
