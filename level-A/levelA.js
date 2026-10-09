/**
 * levelA.js - Visual Controller & Interaction Renderer for Level A (Agnostic)
 *
 * Implements:
 * - Monochromatic vector typography rendering of Letter A.
 * - Dynamic compass / fan legs animation based on crossbar dragging.
 * - Matter.js falling geometric bodies (circle, square, triangle).
 * - Rigid single slot vs Adaptive multi-receptor visual feedback.
 * - "AGNOSTIC" typographic flash victory sequence.
 * - Minimalist Web Audio synthesizer for tactile acoustic feedback.
 */

import { PhysicsA } from './physicsA.js';

export class LevelA {
  constructor() {
    this.name = 'A';
    this.title = 'A · AGNOSTIC';
    this.subtitle = 'Mentalidad agnóstica: desbloquea el travesaño para abrir el compás adaptativo.';

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

  // Audio Feedback Synthesizer (Web Audio API)
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

  playRejectSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.09, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.09);
  }

  playAcceptSound(type) {
    this.initAudio();
    if (!this.audioCtx) return;

    // Frequency based on shape type for harmonic diversity
    const freqs = { circle: 587.33, square: 739.99, triangle: 880.0 }; // D5, F#5, A5
    const baseFreq = freqs[type] || 660;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, this.audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.32);
  }

  playVictoryChime() {
    this.initAudio();
    if (!this.audioCtx) return;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.07 / (idx + 1), this.audioCtx.currentTime + idx * 0.06 + 0.04);
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
    this.canvas.id = 'level-a-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.physics = new PhysicsA({ width: rect.width, height: rect.height });

    // Wire audio triggers
    this.physics.onReject = () => this.playRejectSound();
    this.physics.onAccept = (type) => this.playAcceptSound(type);
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

  isNearCrossbar(x, y) {
    const currentCrossbarY =
      this.physics.crossbarBaseY +
      this.physics.spread * (this.physics.maxCrossbarDragY - this.physics.crossbarBaseY);
    const centerX = this.physics.width / 2;
    const currentBaseSpread = 80 + this.physics.spread * (this.physics.width * 0.38);
    const currentCrossbarWidth = currentBaseSpread * 1.2;

    return (
      Math.abs(x - centerX) <= currentCrossbarWidth / 2 + 30 &&
      Math.abs(y - currentCrossbarY) <= 35
    );
  }

  handleMouseDown(e) {
    const pos = this.getPointerPos(e);
    if (this.isNearCrossbar(pos.x, pos.y)) {
      this.physics.startCrossbarDrag(pos.y);
      this.container.classList.add('cursor-grabbing');
    }
  }

  handleMouseMove(e) {
    const pos = this.getPointerPos(e);
    if (this.physics.isDraggingCrossbar) {
      this.physics.updateCrossbarDrag(pos.y);
    } else {
      if (this.isNearCrossbar(pos.x, pos.y)) {
        this.container.classList.add('cursor-grab');
      } else {
        this.container.classList.remove('cursor-grab');
      }
    }
  }

  handleMouseUp() {
    this.physics.endCrossbarDrag();
    this.container.classList.remove('cursor-grabbing');
  }

  handleTouchStart(e) {
    const pos = this.getPointerPos(e);
    if (this.isNearCrossbar(pos.x, pos.y)) {
      e.preventDefault();
      this.physics.startCrossbarDrag(pos.y);
    }
  }

  handleTouchMove(e) {
    if (this.physics.isDraggingCrossbar) {
      e.preventDefault();
      const pos = this.getPointerPos(e);
      this.physics.updateCrossbarDrag(pos.y);
    }
  }

  handleTouchEnd() {
    this.physics.endCrossbarDrag();
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    const state = this.physics.update(dt);
    this.draw(state);

    // Handle Victory Progression & Transition
    if (state.isCompleted) {
      this.victoryTimer += dt;
      if (this.victoryTimer > 2.6 && !this.victoryTriggered && this.onComplete) {
        this.victoryTriggered = true;
        this.onComplete({
          level: 'A',
          title: this.title,
          nextLevel: 'C'
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

    // Subtle background grid
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

    const exp = state.expansionProgress;

    // 1. Dynamic Geometry of Letter A
    const apexY = this.physics.apexY;
    const baseY = this.physics.baseY;
    const baseSpread = 80 + state.spread * (w * 0.38) + exp * (w * 0.4);

    const leftBaseX = centerX - baseSpread;
    const rightBaseX = centerX + baseSpread;

    const crossbarY =
      this.physics.crossbarBaseY +
      state.spread * (this.physics.maxCrossbarDragY - this.physics.crossbarBaseY);

    // Calculate crossbar intersection with the legs
    const tCrossbar = (crossbarY - apexY) / (baseY - apexY);
    const leftCrossX = centerX + tCrossbar * (leftBaseX - centerX);
    const rightCrossX = centerX + tCrossbar * (rightBaseX - centerX);

    // Draw Letter A Legs (Compass Arms)
    ctx.save();
    ctx.lineWidth = 4.5 + exp * 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = exp > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';

    if (exp > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 24 * exp;
    }

    // Left & Right Leg Lines
    ctx.beginPath();
    ctx.moveTo(leftBaseX, baseY + exp * 100);
    ctx.lineTo(centerX, apexY - exp * 40);
    ctx.lineTo(rightBaseX, baseY + exp * 100);
    ctx.stroke();

    // Apex Pivot Dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, apexY - exp * 40, 5 + exp * 3, 0, Math.PI * 2);
    ctx.fill();

    // Crossbar (`-`) with Interactive Handle
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = this.physics.isDraggingCrossbar ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(leftCrossX, crossbarY);
    ctx.lineTo(rightCrossX, crossbarY);
    ctx.stroke();

    // Crossbar Drag Handle (Slider / Gripper)
    if (exp === 0) {
      const handleWidth = 44;
      const handleHeight = 16;
      ctx.fillStyle = this.physics.isDraggingCrossbar
        ? 'rgba(255, 255, 255, 0.25)'
        : 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = this.physics.isDraggingCrossbar ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(centerX - handleWidth / 2, crossbarY - handleHeight / 2, handleWidth, handleHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Gripper grip lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let g = -1; g <= 1; g++) {
        ctx.beginPath();
        ctx.moveTo(centerX + g * 8, crossbarY - 4);
        ctx.lineTo(centerX + g * 8, crossbarY + 4);
        ctx.stroke();
      }

      // Drag arrow indicator if still in rigid mode
      if (state.spread < 0.15) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        const arrowY = crossbarY + 18 + Math.sin(performance.now() * 0.005) * 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 6, arrowY);
        ctx.lineTo(centerX, arrowY + 6);
        ctx.lineTo(centerX + 6, arrowY);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Draw Receptors at the Base of the A
    if (exp < 0.8) {
      const receptors = this.physics.getReceptors();
      receptors.forEach(rec => {
        ctx.save();
        ctx.translate(rec.x, rec.y);

        ctx.strokeStyle = rec.isRigidSlot ? 'rgba(255, 255, 255, 0.4)' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';

        if (rec.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, rec.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
        } else if (rec.type === 'square') {
          ctx.beginPath();
          ctx.roundRect(-rec.width / 2, -rec.height / 2, rec.width, rec.height, 4);
          ctx.stroke();
          ctx.fill();
        } else if (rec.type === 'triangle') {
          ctx.beginPath();
          const r = rec.radius;
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.866, r * 0.5);
          ctx.lineTo(-r * 0.866, r * 0.5);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
        }

        ctx.restore();
      });
    }

    // 3. Draw Falling Matter.js Geometric Shapes
    this.physics.shapes.forEach(s => {
      const pos = s.body.position;
      const angle = s.body.angle;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);

      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 6;

      if (s.type === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (s.type === 'square') {
        ctx.beginPath();
        ctx.roundRect(-s.size / 2, -s.size / 2, s.size, s.size, 2);
        ctx.fill();
        ctx.stroke();
      } else if (s.type === 'triangle') {
        ctx.beginPath();
        const r = s.size * 0.65;
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.866, r * 0.5);
        ctx.lineTo(-r * 0.866, r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    });

    // 4. Draw Destruction / Rejection Sparks
    this.physics.sparks.forEach(sp => {
      ctx.save();
      const alpha = sp.life / sp.maxLife;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Draw Acceptance Harmonic Bursts
    this.physics.acceptedBursts.forEach(b => {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${b.life * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      if (b.type === 'circle') {
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      } else if (b.type === 'square') {
        ctx.strokeRect(b.x - b.radius / 2, b.y - b.radius / 2, b.radius, b.radius);
      } else {
        const r = b.radius;
        ctx.moveTo(b.x, b.y - r);
        ctx.lineTo(b.x + r * 0.866, b.y + r * 0.5);
        ctx.lineTo(b.x - r * 0.866, b.y + r * 0.5);
        ctx.closePath();
      }
      ctx.stroke();
      ctx.restore();
    });

    // 6. HUD Shape Progress Matrix (Top Right or Bottom Centered)
    if (exp < 0.6) {
      const counts = state.acceptedCounts;
      const target = this.physics.targetPerType;

      ctx.save();
      const hudY = h * 0.88;
      const hudSpacing = 60;
      const startX = centerX - hudSpacing;

      // Circle slot
      this.drawShapeCounter(ctx, startX, hudY, 'circle', counts.circle, target);
      // Square slot
      this.drawShapeCounter(ctx, startX + hudSpacing, hudY, 'square', counts.square, target);
      // Triangle slot
      this.drawShapeCounter(ctx, startX + hudSpacing * 2, hudY, 'triangle', counts.triangle, target);

      ctx.restore();
    }

    // 7. Victory Reveal: Centered "AGNOSTIC" Flash
    if (exp > 0.3) {
      const textAlpha = Math.min(1.0, (exp - 0.3) * 1.6);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Big "AGNOSTIC" Title
      ctx.font = '700 52px "Space Grotesk", sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 24 * textAlpha;
      ctx.fillText('AGNOSTIC', centerX, h * 0.48);

      // Subtitle
      ctx.font = '400 13px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(200, 200, 210, ${textAlpha * 0.8})`;
      ctx.shadowBlur = 0;
      ctx.fillText('MENTALIDAD ABIERTA · SOLUCIONES SIN ATADURAS', centerX, h * 0.55);

      ctx.restore();
    }
  }

  drawShapeCounter(ctx, x, y, type, current, target) {
    ctx.save();
    // Icon
    ctx.strokeStyle = current >= target ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
    ctx.fillStyle = current >= target ? '#ffffff' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;

    if (type === 'circle') {
      ctx.beginPath();
      ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
      ctx.stroke();
      if (current >= target) ctx.fill();
    } else if (type === 'square') {
      ctx.strokeRect(x - 5, y - 15, 10, 10);
      if (current >= target) ctx.fillRect(x - 5, y - 15, 10, 10);
    } else if (type === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(x, y - 17);
      ctx.lineTo(x + 6, y - 6);
      ctx.lineTo(x - 6, y - 6);
      ctx.closePath();
      ctx.stroke();
      if (current >= target) ctx.fill();
    }

    // Number score label
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = current >= target ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`${current}/${target}`, x, y + 10);

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
