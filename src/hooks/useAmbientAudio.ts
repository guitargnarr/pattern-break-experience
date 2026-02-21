/**
 * useAmbientAudio -- Procedural ambient audio for The Pattern Break
 *
 * Scene I   (Gravity Well):  Low drone, claustrophobic, cycling LFO -- stuck
 * Scene II  (The Shatter):   Rising frequency, bright harmonics -- liberation
 * Scene III (The Lattice):   Rhythmic pulses, layered build -- construction
 * Scene IV  (The Forge):     Warm resonance, steady heartbeat -- grounded work
 * Scene V   (Constellation): Ethereal harmonics, open space -- arrival
 */

import { useEffect, useRef, useCallback, useState } from "react";

interface SceneAudioConfig {
  baseFreq: number;
  harmonics: number[];
  harmonicGains: number[];
  waveform: OscillatorType;
  filterFreq: number;
  filterQ: number;
  lfoRate: number;
  lfoDepth: number;
  gain: number;
  detune: number;
  noiseLevel: number;
  filterType: BiquadFilterType;
}

const SCENE_CONFIGS: SceneAudioConfig[] = [
  // I -- Gravity Well: Trapped, cycling, oppressive low drone
  {
    baseFreq: 48.99, // G1 -- heavy, subterranean
    harmonics: [1, 2, 3, 4, 7],
    harmonicGains: [1.0, 0.5, 0.25, 0.15, 0.08],
    waveform: "sine",
    filterFreq: 280,
    filterQ: 3.5,
    lfoRate: 0.12,
    lfoDepth: 6,
    gain: 0.10,
    detune: -3,
    noiseLevel: 0.010,
    filterType: "lowpass",
  },
  // II -- The Shatter: Bright, ascending, crystalline breakout
  {
    baseFreq: 196.0, // G3 -- bright, ascending
    harmonics: [1, 1.5, 2, 3, 5],
    harmonicGains: [0.7, 0.4, 0.5, 0.3, 0.15],
    waveform: "sine",
    filterFreq: 2400,
    filterQ: 0.6,
    lfoRate: 0.25,
    lfoDepth: 12,
    gain: 0.08,
    detune: 7,
    noiseLevel: 0.018,
    filterType: "bandpass",
  },
  // III -- The Lattice: Rhythmic, building, stacking harmonics
  {
    baseFreq: 73.42, // D2 -- constructive
    harmonics: [1, 2, 3, 4, 6],
    harmonicGains: [0.9, 0.6, 0.4, 0.3, 0.15],
    waveform: "triangle",
    filterFreq: 550,
    filterQ: 2.0,
    lfoRate: 0.8,
    lfoDepth: 10,
    gain: 0.09,
    detune: 0,
    noiseLevel: 0.008,
    filterType: "lowpass",
  },
  // IV -- The Forge: Warm, molten, steady pulse
  {
    baseFreq: 110.0, // A2 -- warm, grounded
    harmonics: [1, 2, 2.5, 3, 4],
    harmonicGains: [1.0, 0.5, 0.3, 0.2, 0.1],
    waveform: "sine",
    filterFreq: 700,
    filterQ: 1.8,
    lfoRate: 0.4,
    lfoDepth: 8,
    gain: 0.11,
    detune: -2,
    noiseLevel: 0.006,
    filterType: "lowpass",
  },
  // V -- The Constellation: Ethereal, wide, harmonic series
  {
    baseFreq: 146.83, // D3 -- resolved, open
    harmonics: [1, 1.5, 2, 3, 4],
    harmonicGains: [0.6, 0.5, 0.4, 0.25, 0.15],
    waveform: "sine",
    filterFreq: 1800,
    filterQ: 0.5,
    lfoRate: 0.06,
    lfoDepth: 4,
    gain: 0.10,
    detune: 3,
    noiseLevel: 0.005,
    filterType: "lowpass",
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

function lerpConfig(a: SceneAudioConfig, b: SceneAudioConfig, t: number): SceneAudioConfig {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    baseFreq: lerp(a.baseFreq, b.baseFreq),
    harmonics: a.harmonics.length >= b.harmonics.length ? a.harmonics : b.harmonics,
    harmonicGains: a.harmonicGains.map((g, i) => lerp(g, b.harmonicGains[i] ?? 0)),
    waveform: t < 0.5 ? a.waveform : b.waveform,
    filterFreq: lerp(a.filterFreq, b.filterFreq),
    filterQ: lerp(a.filterQ, b.filterQ),
    lfoRate: lerp(a.lfoRate, b.lfoRate),
    lfoDepth: lerp(a.lfoDepth, b.lfoDepth),
    gain: lerp(a.gain, b.gain),
    detune: lerp(a.detune, b.detune),
    noiseLevel: lerp(a.noiseLevel, b.noiseLevel),
    filterType: t < 0.5 ? a.filterType : b.filterType,
  };
}

interface AudioNodes {
  ctx: AudioContext;
  oscillators: OscillatorNode[];
  oscillatorGains: GainNode[];
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  noiseSource: AudioBufferSourceNode | null;
  noiseGain: GainNode;
  masterGain: GainNode;
  convolver: ConvolverNode;
  convolverGain: GainNode;
  dryGain: GainNode;
}

export function useAmbientAudio(progress: number) {
  const nodesRef = useRef<AudioNodes | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animFrameRef = useRef<number>(0);

  const initAudio = useCallback(() => {
    if (nodesRef.current) return;
    try {
      const ctx = new AudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;

      const convolver = ctx.createConvolver();
      const len = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
      convolver.buffer = buf;

      const convolverGain = ctx.createGain();
      convolverGain.gain.value = 0.3;
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.7;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 280;
      filter.Q.value = 3.5;

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.12;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 6;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      const oscillators: OscillatorNode[] = [];
      const oscillatorGains: GainNode[] = [];
      for (let i = 0; i < 5; i++) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 48.99 * (i + 1);
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(filter);
        osc.start();
        oscillators.push(osc);
        oscillatorGains.push(gain);
      }

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0;
      const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      noiseSource.loop = true;
      noiseSource.connect(noiseGain);
      noiseGain.connect(filter);
      noiseSource.start();

      filter.connect(dryGain);
      filter.connect(convolver);
      convolver.connect(convolverGain);
      dryGain.connect(masterGain);
      convolverGain.connect(masterGain);
      masterGain.connect(ctx.destination);

      nodesRef.current = { ctx, oscillators, oscillatorGains, filter, lfo, lfoGain, noiseSource, noiseGain, masterGain, convolver, convolverGain, dryGain };
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
    nodes.masterGain.gain.linearRampToValueAtTime(1, now + 1.5);
    setIsPlaying(true);
  }, [initAudio]);

  const stopAudio = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    const now = nodes.ctx.currentTime;
    nodes.masterGain.gain.cancelScheduledValues(now);
    nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, now);
    nodes.masterGain.gain.linearRampToValueAtTime(0, now + 1);
    setIsPlaying(false);
  }, []);

  const toggleAudio = useCallback(() => { isPlaying ? stopAudio() : startAudio(); }, [isPlaying, startAudio, stopAudio]);

  useEffect(() => {
    if (!nodesRef.current || !isPlaying) return;
    const nodes = nodesRef.current;
    const now = nodes.ctx.currentTime;
    const ramp = 0.15;
    const { sceneA, sceneB, blend, masterGain: masterLevel } = getSceneBlend(progress);
    const config = blend > 0.001 ? lerpConfig(SCENE_CONFIGS[sceneA], SCENE_CONFIGS[sceneB], blend) : SCENE_CONFIGS[sceneA];

    for (let i = 0; i < 5; i++) {
      const freq = config.baseFreq * (config.harmonics[i] ?? 0);
      const gain = (config.harmonicGains[i] ?? 0) * config.gain * masterLevel;
      nodes.oscillators[i].frequency.cancelScheduledValues(now);
      nodes.oscillators[i].frequency.setValueAtTime(nodes.oscillators[i].frequency.value, now);
      nodes.oscillators[i].frequency.linearRampToValueAtTime(freq || 20, now + ramp);
      nodes.oscillators[i].detune.cancelScheduledValues(now);
      nodes.oscillators[i].detune.setValueAtTime(nodes.oscillators[i].detune.value, now);
      nodes.oscillators[i].detune.linearRampToValueAtTime(config.detune, now + ramp);
      if (i < config.harmonics.length) nodes.oscillators[i].type = config.waveform;
      nodes.oscillatorGains[i].gain.cancelScheduledValues(now);
      nodes.oscillatorGains[i].gain.setValueAtTime(nodes.oscillatorGains[i].gain.value, now);
      nodes.oscillatorGains[i].gain.linearRampToValueAtTime(Math.max(0, gain), now + ramp);
    }

    nodes.filter.type = config.filterType;
    nodes.filter.frequency.cancelScheduledValues(now);
    nodes.filter.frequency.setValueAtTime(nodes.filter.frequency.value, now);
    nodes.filter.frequency.linearRampToValueAtTime(config.filterFreq, now + ramp);
    nodes.filter.Q.cancelScheduledValues(now);
    nodes.filter.Q.setValueAtTime(nodes.filter.Q.value, now);
    nodes.filter.Q.linearRampToValueAtTime(config.filterQ, now + ramp);

    nodes.lfo.frequency.cancelScheduledValues(now);
    nodes.lfo.frequency.setValueAtTime(nodes.lfo.frequency.value, now);
    nodes.lfo.frequency.linearRampToValueAtTime(config.lfoRate, now + ramp);
    nodes.lfoGain.gain.cancelScheduledValues(now);
    nodes.lfoGain.gain.setValueAtTime(nodes.lfoGain.gain.value, now);
    nodes.lfoGain.gain.linearRampToValueAtTime(config.lfoDepth, now + ramp);

    nodes.noiseGain.gain.cancelScheduledValues(now);
    nodes.noiseGain.gain.setValueAtTime(nodes.noiseGain.gain.value, now);
    nodes.noiseGain.gain.linearRampToValueAtTime(config.noiseLevel * masterLevel, now + ramp);

    const wetLevel = sceneA === 4 || sceneB === 4 ? 0.5 : sceneA === 1 || sceneB === 1 ? 0.45 : 0.25;
    nodes.convolverGain.gain.cancelScheduledValues(now);
    nodes.convolverGain.gain.setValueAtTime(nodes.convolverGain.gain.value, now);
    nodes.convolverGain.gain.linearRampToValueAtTime(wetLevel, now + ramp);
    nodes.dryGain.gain.cancelScheduledValues(now);
    nodes.dryGain.gain.setValueAtTime(nodes.dryGain.gain.value, now);
    nodes.dryGain.gain.linearRampToValueAtTime(1 - wetLevel, now + ramp);
  }, [progress, isPlaying]);

  useEffect(() => {
    return () => {
      if (nodesRef.current) {
        nodesRef.current.oscillators.forEach(o => { try { o.stop(); } catch {} });
        try { nodesRef.current.lfo.stop(); } catch {}
        try { nodesRef.current.noiseSource?.stop(); } catch {}
        try { nodesRef.current.ctx.close(); } catch {}
        nodesRef.current = null;
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return { isPlaying, toggleAudio, startAudio, stopAudio };
}
