#!/usr/bin/env node
/**
 * create-og-images.js
 * Generates CG OG image (1200x630) and social preview (1080x1080)
 * for The Pattern Break Experience.
 *
 * Brand: teal (#14b8a6) / amber (#d4a574) / dark (#0a0a0e)
 * Visual: particle streams converging from chaos to constellation
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Seeded PRNG (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Colors ---
const DARK = '#0a0a0e';
const TEAL = '#14b8a6';
const AMBER = '#d4a574';
const ORANGE = '#f97316';
const CREAM = '#e8c99b';
const SILVER = '#8fa4b8';

function drawBackground(ctx, w, h) {
  // Base dark
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, w, h);

  // Deep radial glow -- amber center
  const grad1 = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.5);
  grad1.addColorStop(0, 'rgba(249, 115, 22, 0.08)');
  grad1.addColorStop(0.3, 'rgba(212, 165, 116, 0.04)');
  grad1.addColorStop(0.7, 'rgba(20, 184, 166, 0.03)');
  grad1.addColorStop(1, 'transparent');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, w, h);

  // Secondary teal glow -- upper left
  const grad2 = ctx.createRadialGradient(w * 0.2, h * 0.25, 0, w * 0.2, h * 0.25, w * 0.35);
  grad2.addColorStop(0, 'rgba(20, 184, 166, 0.06)');
  grad2.addColorStop(1, 'transparent');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, w, h);

  // Amber glow -- lower right
  const grad3 = ctx.createRadialGradient(w * 0.8, h * 0.75, 0, w * 0.8, h * 0.75, w * 0.3);
  grad3.addColorStop(0, 'rgba(212, 165, 116, 0.05)');
  grad3.addColorStop(1, 'transparent');
  ctx.fillStyle = grad3;
  ctx.fillRect(0, 0, w, h);
}

function drawParticleStreams(ctx, w, h, rand) {
  // Draw 5 converging streams from edges toward center
  const cx = w * 0.5;
  const cy = h * 0.5;

  const origins = [
    { x: -w * 0.1, y: h * 0.2 },
    { x: w * 1.1, y: h * 0.15 },
    { x: -w * 0.05, y: h * 0.85 },
    { x: w * 1.05, y: h * 0.8 },
    { x: w * 0.5, y: -h * 0.1 },
  ];

  for (const origin of origins) {
    const count = 120;
    for (let i = 0; i < count; i++) {
      const t = rand();
      const spread = (rand() - 0.5) * 80 * (1 - t);

      // Smoothstep convergence
      const ease = t * t * (3 - 2 * t);
      const x = origin.x + (cx - origin.x) * ease + Math.sin(t * Math.PI * 3) * spread;
      const y = origin.y + (cy - origin.y) * ease + Math.cos(t * Math.PI * 2.5) * spread * 0.5;

      const heat = 1 - t;
      const size = 1 + rand() * 2.5 * (1 - t * 0.5);

      // Color: amber near origin, teal near center
      const r = Math.floor(212 * heat + 20 * (1 - heat));
      const g = Math.floor(165 * heat + 184 * (1 - heat));
      const b = Math.floor(116 * heat + 166 * (1 - heat));
      const alpha = 0.15 + heat * 0.5 + rand() * 0.15;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    }
  }
}

function drawConstellationNodes(ctx, w, h, rand) {
  // Resolved constellation near center
  const cx = w * 0.5;
  const cy = h * 0.5;
  const nodes = [];

  for (let ring = 0; ring < 4; ring++) {
    const count = 8 + ring * 4;
    const radius = 30 + ring * 35;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.3;
      const r = radius + (rand() - 0.5) * 15;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r * 0.55;
      nodes.push({ x, y, ring });

      // Node glow
      const nodeGrad = ctx.createRadialGradient(x, y, 0, x, y, 6 + rand() * 4);
      const isTeal = rand() > 0.4;
      if (isTeal) {
        nodeGrad.addColorStop(0, 'rgba(20, 184, 166, 0.8)');
        nodeGrad.addColorStop(0.5, 'rgba(20, 184, 166, 0.2)');
      } else {
        nodeGrad.addColorStop(0, 'rgba(232, 201, 155, 0.8)');
        nodeGrad.addColorStop(0.5, 'rgba(232, 201, 155, 0.2)');
      }
      nodeGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nodeGrad;
      ctx.fillRect(x - 12, y - 12, 24, 24);

      // Core dot
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + rand() * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isTeal ? 'rgba(94, 234, 212, 0.9)' : 'rgba(232, 201, 155, 0.9)';
      ctx.fill();
    }
  }

  // Draw connections between nearby nodes
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.12)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 70 && rand() > 0.4) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }
}

function drawCentralGlow(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.5;

  // Outer halo
  const outer = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
  outer.addColorStop(0, 'rgba(20, 184, 166, 0.12)');
  outer.addColorStop(0.4, 'rgba(20, 184, 166, 0.04)');
  outer.addColorStop(1, 'transparent');
  ctx.fillStyle = outer;
  ctx.fillRect(0, 0, w, h);

  // Inner core
  const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
  inner.addColorStop(0, 'rgba(232, 201, 155, 0.25)');
  inner.addColorStop(0.5, 'rgba(249, 115, 22, 0.08)');
  inner.addColorStop(1, 'transparent');
  ctx.fillStyle = inner;
  ctx.fillRect(cx - 60, cy - 60, 120, 120);
}

function drawScatteredStars(ctx, w, h, rand) {
  for (let i = 0; i < 200; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const size = 0.3 + rand() * 1.2;
    const alpha = 0.1 + rand() * 0.25;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160, 180, 196, ${alpha})`;
    ctx.fill();
  }
}

function drawEmbers(ctx, w, h, rand) {
  // Rising ember particles in the lower half
  for (let i = 0; i < 60; i++) {
    const x = w * 0.3 + rand() * w * 0.4;
    const y = h * 0.5 + rand() * h * 0.4;
    const size = 0.5 + rand() * 1.5;
    const alpha = 0.1 + rand() * 0.4;
    const r = 230 + Math.floor(rand() * 25);
    const g = 140 + Math.floor(rand() * 60);
    const b = 30 + Math.floor(rand() * 40);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fill();
  }
}

function drawText(ctx, w, h, format) {
  // "THE PATTERN BREAK" title
  const isSquare = format === 'square';
  const titleSize = isSquare ? 64 : 56;
  const subtitleSize = isSquare ? 18 : 16;
  const tagSize = isSquare ? 13 : 11;

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title shadow
  ctx.shadowColor = 'rgba(212, 165, 116, 0.3)';
  ctx.shadowBlur = 40;
  ctx.font = `300 ${titleSize}px "Georgia", serif`;
  ctx.fillStyle = CREAM;
  const titleY = isSquare ? h * 0.42 : h * 0.40;
  ctx.fillText('The Pattern Break', w / 2, titleY);
  ctx.shadowBlur = 0;

  // Gold rule
  const ruleY = titleY + titleSize * 0.55;
  const ruleW = 80;
  const ruleGrad = ctx.createLinearGradient(w / 2 - ruleW, ruleY, w / 2 + ruleW, ruleY);
  ruleGrad.addColorStop(0, 'transparent');
  ruleGrad.addColorStop(0.2, 'rgba(212, 165, 116, 0.5)');
  ruleGrad.addColorStop(0.5, 'rgba(212, 165, 116, 0.7)');
  ruleGrad.addColorStop(0.8, 'rgba(212, 165, 116, 0.5)');
  ruleGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = ruleGrad;
  ctx.fillRect(w / 2 - ruleW, ruleY, ruleW * 2, 1);

  // Subtitle
  ctx.font = `400 ${subtitleSize}px "Helvetica Neue", sans-serif`;
  ctx.fillStyle = SILVER;
  ctx.letterSpacing = '0.35em';
  const subY = ruleY + 30;
  ctx.fillText('119 DAYS FROM BROKEN BINARY TO BUSINESS ENTITY', w / 2, subY);

  // Bottom tag -- "Project Lavos"
  ctx.font = `400 ${tagSize}px "Helvetica Neue", sans-serif`;
  ctx.fillStyle = 'rgba(160, 180, 196, 0.4)';
  const tagY = isSquare ? h * 0.92 : h * 0.88;
  ctx.fillText('PROJECT LAVOS', w / 2, tagY);

  // Top-left scene labels (subtle)
  if (!isSquare) {
    ctx.textAlign = 'left';
    ctx.font = `300 9px "Helvetica Neue", sans-serif`;
    ctx.fillStyle = 'rgba(160, 180, 196, 0.2)';
    const scenes = ['I  THE GRAVITY WELL', 'II  THE SHATTER', 'III  THE LATTICE', 'IV  THE FORGE', 'V  THE CONSTELLATION'];
    scenes.forEach((s, i) => {
      ctx.fillText(s, 40, h * 0.15 + i * 14);
    });
  }
}

function drawVignette(ctx, w, h) {
  // Edge vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(0.7, 'rgba(10, 10, 14, 0.3)');
  vignette.addColorStop(1, 'rgba(10, 10, 14, 0.7)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function generateImage(w, h, format, outputPath) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(119); // seed: 119 days

  drawBackground(ctx, w, h);
  drawScatteredStars(ctx, w, h, rand);
  drawParticleStreams(ctx, w, h, rand);
  drawConstellationNodes(ctx, w, h, rand);
  drawCentralGlow(ctx, w, h);
  drawEmbers(ctx, w, h, rand);
  drawVignette(ctx, w, h);
  drawText(ctx, w, h, format);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath} (${w}x${h})`);
}

// --- Generate both ---
const outDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

generateImage(1200, 630, 'og', path.join(outDir, 'og-image.png'));
generateImage(1080, 1080, 'square', path.join(outDir, 'social-preview.png'));

console.log('\nDone. Files written to public/');
