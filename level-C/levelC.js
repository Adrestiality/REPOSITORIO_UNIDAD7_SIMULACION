/**
 * levelC.js - Visual Controller & Interaction Renderer for Level C (Consulting)
 *
 * Implements:
 * - Monochromatic vector rendering of the monumental Letter C container.
 * - Chaotic swarm motion: Rectilinear (Digital) vs Fluid (Innovation).
 * - Anti-brute force barrier feedback.
 * - Progressive energetic activation of ≡ (Digital) and ~ (Innovation) receptors.
 * - Centered "CONSULTING" victory flash sequence.
 * - Latency-free Web Audio synthesizer for tactile acoustic feedback.
 */

import { PhysicsC } from './physicsC.js';

export class LevelC {
  constructor() {
    this.name = 'C';
    this.title = 'C · CONSULTING';
    this.subtitle = 'Análisis estratégico: descompón el caos y filtra las fuerzas hacia Transformación Digital o Innovación.';

    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.physics = null;
    this.onComplete = null;
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastTime = 0;

    // Victory animation state
    this.victoryTriggered = false;
    this.victoryTimer = 0;

    // Audio Synthesizer
    this.audioCtx = null;

    // Bound interaction handlers
    this.boundResize = this.handleResize.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
  }

  // Audio Synthesizer (Web Audio API)
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playBarrierSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, this.audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.09);
  }

  playAbsorbSound(type) {
    this.initAudio();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    if (type === 'digital') {
      // Crisp square harmonic bell
      osc.type = 'square';
      osc.frequency.setValueAtTime(659.25, this.audioCtx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(987.77, this.audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.22);
    } else {
      // Fluid sinusoidal swell
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, this.audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.07, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.28);
    }

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  }

  playVictoryChime() {
    this.initAudio();
    if (!this.audioCtx) return;
    const freqs = [440, 554.37, 659.25, 880, 1108.73]; // A major 9th
    freqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), this.audioCtx.currentTime + idx * 0.06 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime + idx * 0.06);
      osc.stop(this.audioCtx.currentTime + 1.9);
    });
  }

  init(container, onCompleteCallback) {
    this.container = container;
    this.onComplete = onCompleteCallback;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'level-c-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.physics = new PhysicsC({ width: rect.width, height: rect.height });

    // Audio triggers
    this.physics.onBarrierBlock = () => this.playBarrierSound();
    this.physics.onAbsorb = (type) => this.playAbsorbSound(type);
    this.physics.onWin = () => this.playVictoryChime();

    // Event listeners
    window.addEventListener('resize', this.boundResize);
    this.canvas.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseup', this.boundMouseUp);
    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    window.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    window.addEventListener('touchend', this.boundTouchEnd);

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  handleResize() {
    if (!this.container || !this.canvas) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.physics.resize(rect.width, rect.height);
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  handleMouseDown(e) {
    const pos = this.getPointerPos(e);
    const action = this.physics.startDrag(pos.x, pos.y);
    if (action === 'arc') {
      this.container.classList.add('cursor-grabbing');
    }
  }

  handleMouseMove(e) {
    const pos = this.getPointerPos(e);
    if (this.physics.isDraggingArc || this.physics.draggedParticle) {
      this.physics.updateDrag(pos.x, pos.y);
    } else {
      const dx = pos.x - this.physics.center.x;
      const dy = pos.y - this.physics.center.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= this.physics.innerRadius * 0.7 && dist <= this.physics.outerRadius * 1.4) {
        this.container.classList.add('cursor-grab');
      } else {
        this.container.classList.remove('cursor-grab');
      }
    }
  }

  handleMouseUp() {
    this.physics.endDrag();
    this.container.classList.remove('cursor-grabbing');
  }

  handleTouchStart(e) {
    e.preventDefault();
    const pos = this.getPointerPos(e);
    this.physics.startDrag(pos.x, pos.y);
  }

  handleTouchMove(e) {
    e.preventDefault();
    const pos = this.getPointerPos(e);
    this.physics.updateDrag(pos.x, pos.y);
  }

  handleTouchEnd() {
    this.physics.endDrag();
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    const state = this.physics.update(dt);
    this.draw(state);

    if (state.isCompleted) {
      this.victoryTimer += dt;
      if (this.victoryTimer > 2.6 && !this.victoryTriggered && this.onComplete) {
        this.victoryTriggered = true;
        this.onComplete({
          level: 'C',
          title: this.title,
          nextLevel: 'V'
        });
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  draw(state) {
    const ctx = this.ctx;
    const rect = this.container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const centerX = w / 2;

    // Clear background
    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, 0, w, h);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const exp = state.victoryProgress;
    const center = this.physics.center;
    const rOuter = this.physics.outerRadius;
    const rInner = this.physics.innerRadius;
    const angle = state.angle;
    const openingHalf = this.physics.openingHalfAngle;
    const flash = state.barrierFlash;

    // 1. Draw Letter C Container
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    // Chamber path
    ctx.beginPath();
    ctx.arc(0, 0, rOuter, openingHalf, Math.PI * 2 - openingHalf, false);
    ctx.arc(0, 0, rInner, Math.PI * 2 - openingHalf, openingHalf, true);
    ctx.closePath();

    // Fill & Barrier flash
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + flash * 0.25})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20 * flash;
    } else {
      ctx.fillStyle = this.physics.isDraggingArc
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.035)';
    }
    ctx.fill();

    // Outline
    ctx.lineWidth = 4.5 + exp * 3.0;
    ctx.strokeStyle = exp > 0 || flash > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
    if (exp > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 24 * exp;
    }
    ctx.stroke();

    // Subtle measurement tick marks along outer curve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    for (let t = openingHalf + 0.3; t < Math.PI * 2 - openingHalf - 0.2; t += 0.35) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(t) * (rOuter - 6), Math.sin(t) * (rOuter - 6));
      ctx.lineTo(Math.cos(t) * rOuter, Math.sin(t) * rOuter);
      ctx.stroke();
    }

    // Centrifugal Filter Nozzle Indicator
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(Math.cos(openingHalf) * rOuter, Math.sin(openingHalf) * rOuter, 4, 0, Math.PI * 2);
    ctx.arc(Math.cos(-openingHalf) * rOuter, Math.sin(-openingHalf) * rOuter, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 2. Draw Chaotic Swarm Particles
    this.physics.particles.forEach(p => {
      ctx.save();
      // Draw trails
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let t = 1; t < p.trail.length; t++) {
          ctx.lineTo(p.trail[t].x, p.trail[t].y);
        }
        ctx.strokeStyle =
          p.type === 'digital' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(200, 230, 255, 0.35)';
        ctx.lineWidth = p.type === 'digital' ? 1.5 : 2;
        ctx.stroke();
      }

      ctx.translate(p.x, p.y);

      if (p.type === 'digital') {
        // Digital Transformation: Crisp rectilinear square
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
      } else {
        // Innovation: Fluid undulating circle
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 3. Draw Absorption Bursts
    this.physics.absorptionBursts.forEach(b => {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${b.life * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      if (b.type === 'digital') {
        ctx.strokeRect(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2);
      } else {
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 4. Draw Receptors Below C
    const leftRec = this.physics.leftReceptor;
    const rightRec = this.physics.rightReceptor;

    // LEFT RECEPTOR: ≡ Digital Transformation (Parallel Straight Lines)
    this.drawDigitalReceptor(ctx, leftRec);

    // RIGHT RECEPTOR: ~ Innovation (Fluid Oscillating Waves)
    this.drawInnovationReceptor(ctx, rightRec);

    // 5. Victory Reveal: Centered "CONSULTING" Flash
    if (exp > 0.3) {
      const textAlpha = Math.min(1.0, (exp - 0.3) * 1.6);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Big "CONSULTING" Title
      ctx.font = '700 50px "Space Grotesk", sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 24 * textAlpha;
      ctx.fillText('CONSULTING', centerX, center.y);

      // Subtitle
      ctx.font = '400 13px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(200, 200, 210, ${textAlpha * 0.8})`;
      ctx.shadowBlur = 0;
      ctx.fillText('ANÁLISIS ESTRATÉGICO · CLASIFICACIÓN DE VALOR', centerX, center.y + 42);

      ctx.restore();
    }
  }

  drawDigitalReceptor(ctx, rec) {
    ctx.save();
    ctx.translate(rec.x, rec.y);

    // Receptor Container Box
    ctx.strokeStyle = rec.glow > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(-rec.width / 2, -rec.height / 2, rec.width, rec.height, 8);
    ctx.fill();
    ctx.stroke();

    // ≡ Symbol and Progress Lines
    const progress = rec.absorbed / rec.target;
    ctx.lineWidth = 3;
    const lineSpacing = 12;
    for (let l = -1; l <= 1; l++) {
      const lineY = l * lineSpacing;
      const isActive = progress >= (l + 2) / 3;

      ctx.strokeStyle = isActive || rec.glow > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
      if (isActive) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(-22, lineY);
      ctx.lineTo(22, lineY);
      ctx.stroke();
    }

    // Label & Counter
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = rec.absorbed >= rec.target ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`TRANSFORMACIÓN [${rec.absorbed}/${rec.target}]`, 0, rec.height / 2 + 18);

    ctx.restore();
  }

  drawInnovationReceptor(ctx, rec) {
    ctx.save();
    ctx.translate(rec.x, rec.y);

    // Receptor Container Box
    ctx.strokeStyle = rec.glow > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(-rec.width / 2, -rec.height / 2, rec.width, rec.height, 8);
    ctx.fill();
    ctx.stroke();

    // ~ Symbol (Fluid Sinusoidal Waves)
    const progress = rec.absorbed / rec.target;
    const time = performance.now() * 0.004;
    const waveCount = 2;

    for (let w = 0; w < waveCount; w++) {
      const waveY = (w - 0.5) * 16;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = progress > 0.3 || rec.glow > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
      if (rec.glow > 0) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      for (let x = -24; x <= 24; x += 2) {
        const amp = 4 + progress * 4;
        const y = waveY + Math.sin((x * 0.15) + time + w) * amp;
        if (x === -24) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Label & Counter
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = rec.absorbed >= rec.target ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`INNOVACIÓN [${rec.absorbed}/${rec.target}]`, 0, rec.height / 2 + 18);

    ctx.restore();
  }

  reset() {
    if (this.physics) {
      this.physics.reset();
    }
    this.victoryTriggered = false;
    this.victoryTimer = 0;
  }

  destroy() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.boundResize);
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.boundMouseDown);
      window.removeEventListener('mousemove', this.boundMouseMove);
      window.removeEventListener('mouseup', this.boundMouseUp);
      this.canvas.removeEventListener('touchstart', this.boundTouchStart);
      window.removeEventListener('touchmove', this.boundTouchMove);
      window.removeEventListener('touchend', this.boundTouchEnd);
      this.canvas.remove();
      this.canvas = null;
    }
    if (this.physics) {
      this.physics.destroy();
      this.physics = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.ctx = null;
    this.container = null;
  }
}
