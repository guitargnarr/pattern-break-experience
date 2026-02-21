/**
 * useAmbientAudio -- Whistling wind for The Pattern Break
 *
 * Fundamentally different from Quiet Trade's oscillator drones.
 * This engine is built on shaped noise -- bandpass-filtered white noise
 * with slow organic modulation to simulate wind gusts, lulls, and
 * whistling harmonics through narrow spaces.
 *
 * Scene I   (Gravity Well):  Tight, suffocating wind trapped in a spiral
 * Scene II  (The Shatter):   Explosive gust, debris whistling outward
 * Scene III (The Lattice):   Steady crosswind through open structure
 * Scene IV  (The Forge):     Hot updraft, low roar with high overtones
 * Scene V   (Constellation): Vast, high-altitude wind -- thin and pure
 */

import { useEffect, useRef, useCallback, useState } from "react";

interface WindConfig {
  // Primary wind band
  bandFreq: number;       // Center frequency of main bandpass
  bandQ: number;          // Width of band (higher = narrower whistle)
  bandGain: number;       // Level of main wind

  // Whistle overtone (narrow resonant peak)
  whistleFreq: number;
  whistleQ: number;
  whistleGain: number;

  // Low rumble layer
  rumbleFreq: number;
  rumbleGain: number;

  // Gust modulation
  gustRate: number;       // How fast gusts cycle (Hz)
  gustDepth: number;      // How much the volume swells (0-1)
  gustShape: number;      // LFO depth on filter freq (Hz)

  // Reverb wetness
  reverbWet: number;
}

const WIND_CONFIGS: WindConfig[] = [
  // I -- Gravity Well: Tight spiral, moaning, confined
  {
    bandFreq: 350,
    bandQ: 1.8,
    bandGain: 0.12,
    whistleFreq: 800,
    whistleQ: 12,
    whistleGain: 0.03,
    rumbleFreq: 80,
    rumbleGain: 0.06,
    gustRate: 0.15,
    gustDepth: 0.4,
    gustShape: 60,
    reverbWet: 0.2,
  },
  // II -- The Shatter: Explosive, wide, debris scatter
  {
    bandFreq: 1200,
    bandQ: 0.5,
    bandGain: 0.14,
    whistleFreq: 3200,
    whistleQ: 8,
    whistleGain: 0.04,
    rumbleFreq: 120,
    rumbleGain: 0.08,
    gustRate: 0.35,
    gustDepth: 0.6,
    gustShape: 200,
    reverbWet: 0.45,
  },
  // III -- The Lattice: Steady through-draft, structural
  {
    bandFreq: 600,
    bandQ: 1.2,
    bandGain: 0.10,
    whistleFreq: 1800,
    whistleQ: 15,
    whistleGain: 0.025,
    rumbleFreq: 90,
    rumbleGain: 0.04,
    gustRate: 0.22,
    gustDepth: 0.3,
    gustShape: 80,
    reverbWet: 0.3,
  },
  // IV -- The Forge: Hot updraft, furnace roar, high singing
  {
    bandFreq: 450,
    bandQ: 1.0,
    bandGain: 0.13,
    whistleFreq: 2400,
    whistleQ: 18,
    whistleGain: 0.035,
    rumbleFreq: 60,
    rumbleGain: 0.09,
    gustRate: 0.18,
    gustDepth: 0.35,
    gustShape: 50,
    reverbWet: 0.25,
  },
  // V -- Constellation: High altitude, thin, pure, vast
  {
    bandFreq: 2000,
    bandQ: 0.8,
    bandGain: 0.08,
    whistleFreq: 4500,
    whistleQ: 20,
    whistleGain: 0.02,
    rumbleFreq: 100,
    rumbleGain: 0.02,
    gustRate: 0.08,
    gustDepth: 0.5,
    gustShape: 300,
    reverbWet: 0.55,
  },
];

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

function lerpConfig(a: WindConfig, b: WindConfig, t: number): WindConfig {
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

interface WindNodes {
  ctx: AudioContext;

  // Noise source (shared)
  noiseSource: AudioBufferSourceNode;

  // Primary wind band
  bandFilter: BiquadFilterNode;
  bandGain: GainNode;

  // Whistle resonance
  whistleFilter: BiquadFilterNode;
  whistleGain: GainNode;

  // Low rumble
  rumbleFilter: BiquadFilterNode;
  rumbleGain: GainNode;

  // Gust modulation LFOs
  gustLfo: OscillatorNode;
  gustLfoGain: GainNode;          // modulates master volume
  gustFilterLfo: OscillatorNode;
  gustFilterLfoGain: GainNode;    // modulates band filter freq

  // Second gust LFO (slower, for whistle variation)
  gustLfo2: OscillatorNode;
  gustLfo2Gain: GainNode;

  // Reverb
  convolver: ConvolverNode;
  reverbGain: GainNode;
  dryGain: GainNode;

  // Master
  masterGain: GainNode;
}

export function useAmbientAudio(progress: number) {
  const nodesRef = useRef<WindNodes | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

      // --- Primary wind band (bandpass) ---
      const bandFilter = ctx.createBiquadFilter();
      bandFilter.type = "bandpass";
      bandFilter.frequency.value = 350;
      bandFilter.Q.value = 1.8;
      const bandGain = ctx.createGain();
      bandGain.gain.value = 0;

      // --- Whistle resonance (very narrow bandpass) ---
      const whistleFilter = ctx.createBiquadFilter();
      whistleFilter.type = "bandpass";
      whistleFilter.frequency.value = 800;
      whistleFilter.Q.value = 12;
      const whistleGain = ctx.createGain();
      whistleGain.gain.value = 0;

      // --- Low rumble (lowpass) ---
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = "lowpass";
      rumbleFilter.frequency.value = 80;
      rumbleFilter.Q.value = 1.0;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0;

      // --- Connect noise to all three bands ---
      noiseSource.connect(bandFilter);
      noiseSource.connect(whistleFilter);
      noiseSource.connect(rumbleFilter);
      bandFilter.connect(bandGain);
      whistleFilter.connect(whistleGain);
      rumbleFilter.connect(rumbleGain);

      // --- Gust LFO (modulates master gain for swells) ---
      const gustLfo = ctx.createOscillator();
      gustLfo.type = "sine";
      gustLfo.frequency.value = 0.15;
      const gustLfoGain = ctx.createGain();
      gustLfoGain.gain.value = 0.4;

      // --- Gust filter LFO (modulates band center freq for movement) ---
      const gustFilterLfo = ctx.createOscillator();
      gustFilterLfo.type = "sine";
      gustFilterLfo.frequency.value = 0.07; // slower than volume gust
      const gustFilterLfoGain = ctx.createGain();
      gustFilterLfoGain.gain.value = 60;

      // --- Second whistle LFO (very slow pitch drift) ---
      const gustLfo2 = ctx.createOscillator();
      gustLfo2.type = "sine";
      gustLfo2.frequency.value = 0.04;
      const gustLfo2Gain = ctx.createGain();
      gustLfo2Gain.gain.value = 100;

      // LFO connections
      gustLfo.connect(gustLfoGain);
      gustFilterLfo.connect(gustFilterLfoGain);
      gustFilterLfoGain.connect(bandFilter.frequency);
      gustLfo2.connect(gustLfo2Gain);
      gustLfo2Gain.connect(whistleFilter.frequency);

      gustLfo.start();
      gustFilterLfo.start();
      gustLfo2.start();
      noiseSource.start();

      // --- Reverb (longer tail for wind) ---
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

      // --- Master ---
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;

      // Gust LFO -> master gain modulation
      gustLfoGain.connect(masterGain.gain);

      // Mix bus -> dry/wet -> master
      const mixBus = ctx.createGain();
      mixBus.gain.value = 1;
      bandGain.connect(mixBus);
      whistleGain.connect(mixBus);
      rumbleGain.connect(mixBus);

      mixBus.connect(dryGain);
      mixBus.connect(convolver);
      convolver.connect(reverbGain);
      dryGain.connect(masterGain);
      reverbGain.connect(masterGain);
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
      };
    } catch (e) {
      console.warn("Web Audio unavailable:", e);
    }
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
  }, [initAudio]);

  const stopAudio = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    const now = nodes.ctx.currentTime;
    nodes.masterGain.gain.cancelScheduledValues(now);
    nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, now);
    nodes.masterGain.gain.linearRampToValueAtTime(0, now + 1.5);
    setIsPlaying(false);
  }, []);

  const toggleAudio = useCallback(() => {
    isPlaying ? stopAudio() : startAudio();
  }, [isPlaying, startAudio, stopAudio]);

  // --- Update wind parameters based on scroll progress ---
  useEffect(() => {
    if (!nodesRef.current || !isPlaying) return;
    const nodes = nodesRef.current;
    const now = nodes.ctx.currentTime;
    const ramp = 0.25; // slightly longer ramp for organic transitions

    const { sceneA, sceneB, blend, masterGain: masterLevel } = getSceneBlend(progress);
    const config = blend > 0.001
      ? lerpConfig(WIND_CONFIGS[sceneA], WIND_CONFIGS[sceneB], blend)
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

    // Filter frequency modulation (wind movement)
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
