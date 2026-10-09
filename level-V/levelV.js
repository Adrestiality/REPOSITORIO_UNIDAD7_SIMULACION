/**
 * levelV.js - Visual Controller & Interaction Renderer for Level V (Value) and Grand Finale
 *
 * Implements:
 * - Monochromatic vector rendering of Letter V and Diagnostic Core.
 * - Anti-direct-execution barrier feedback.
 * - Dynamic elastic tethers connecting the vertex to the Expert Ally network.
 * - Pulse surge conduit animation.
 * - Grand Finale: "A — C — V" typographic assembly and "Agnostic Consulting Value" closing.
 * - Latency-free Web Audio synthesizer.
 */

import { PhysicsV } from './physicsV.js';

export class LevelV {
  constructor() {
    this.name = 'V';
    this.title = 'V · VALUE';
    this.subtitle = 'Articulación de valor: conecta el diagnóstico con la red de aliados expertos.';

    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.physics = null;
    this.onComplete = null;
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastTime = 0;

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

  playBlockSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.09, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.13);
  }

  playTetherSound(count, total) {
    this.initAudio();
    if (!this.audioCtx) return;
    const pentatonic = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const freq = pentatonic[Math.min(count - 1, pentatonic.length - 1)] || 600;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.15, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.07, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.36);
  }

  playCoreFlowSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(330, this.audioCtx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.46);
  }

  playIgniteSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1318.5, this.audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.42);
  }

  playFinaleSwell() {
    this.initAudio();
    if (!this.audioCtx) return;
    // Majestic major chord progression
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 1046.5];
    chord.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), this.audioCtx.currentTime + idx * 0.08 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime + idx * 0.08);
      osc.stop(this.audioCtx.currentTime + 2.6);
    });
  }

  init(container, onCompleteCallback) {
    this.container = container;
    this.onComplete = onCompleteCallback;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'level-v-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.physics = new PhysicsV({ width: rect.width, height: rect.height });

    // Audio triggers
    this.physics.onDirectBlock = () => this.playBlockSound();
    this.physics.onTetherConnect = (id, count, total) => this.playTetherSound(count, total);
    this.physics.onCoreFlow = () => this.playCoreFlowSound();
    this.physics.onNodeIgnite = () => this.playIgniteSound();
    this.physics.onFinaleStart = () => this.playFinaleSwell();

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

    // Check if clicking restart button on Grand Finale screen
    if (this.physics.isCompleted && this.physics.grandFinaleTimer > 3.0) {
      const centerX = this.physics.width / 2;
      const btnY = this.physics.height * 0.85;
      if (Math.abs(pos.x - centerX) < 120 && Math.abs(pos.y - btnY) < 25) {
        if (window.game) window.game.switchLevel(0);
        return;
      }
    }

    const action = this.physics.startDrag(pos.x, pos.y);
    if (action) {
      this.container.classList.add('cursor-grabbing');
    }
  }

  handleMouseMove(e) {
    const pos = this.getPointerPos(e);
    if (this.physics.core.isDragging || this.physics.activeDragTether) {
      this.physics.updateDrag(pos.x, pos.y);
    } else {
      const dxV = pos.x - this.physics.vertex.x;
      const dyV = pos.y - this.physics.vertex.y;
      const dxC = pos.x - this.physics.core.x;
      const dyC = pos.y - this.physics.core.y;
      const nearVertex = Math.hypot(dxV, dyV) <= 32;
      const nearCore = Math.hypot(dxC, dyC) <= this.physics.core.radius + 10;
      const nearNode = this.physics.nodes.some(
        n => !n.connected && Math.hypot(pos.x - n.x, pos.y - n.y) <= n.radius + 10
      );

      if (nearVertex || nearCore || nearNode) {
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

    // Check restart button on grand finale
    if (this.physics.isCompleted && this.physics.grandFinaleTimer > 3.0) {
      const centerX = this.physics.width / 2;
      const btnY = this.physics.height * 0.85;
      if (Math.abs(pos.x - centerX) < 120 && Math.abs(pos.y - btnY) < 25) {
        if (window.game) window.game.switchLevel(0);
        return;
      }
    }

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

    const finaleTimer = state.grandFinaleTimer;
    const isFinale = state.isCompleted && finaleTimer > 0.8;

    // If Grand Finale is active, transition into typographic sequence
    if (isFinale) {
      this.drawGrandFinale(ctx, w, h, finaleTimer);
      return;
    }

    const topLeft = this.physics.topLeft;
    const topRight = this.physics.topRight;
    const vertex = this.physics.vertex;
    const vib = state.vertexVibration;
    const flash = state.barrierFlash;

    // 1. Draw Connected Tethers (Elastic Springs)
    this.physics.nodes.forEach(node => {
      if (node.connected) {
        ctx.save();
        ctx.strokeStyle = node.ignition > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2.5 + node.ignition * 2.0;

        if (node.ignition > 0) {
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 16 * node.ignition;
        }

        // Draw spring/catenary curve from vertex to node
        const midX = (vertex.x + node.x) / 2;
        const midY = (vertex.y + node.y) / 2 + 10;

        ctx.beginPath();
        ctx.moveTo(vertex.x, vertex.y);
        ctx.quadraticCurveTo(midX, midY, node.x, node.y);
        ctx.stroke();
        ctx.restore();
      }
    });

    // 2. Draw Active Drag Tether Line
    if (this.physics.activeDragTether) {
      const dteth = this.physics.activeDragTether;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(dteth.startX, dteth.startY);
      ctx.lineTo(dteth.currentX, dteth.currentY);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Letter V Funnel
    ctx.save();
    const vx = vertex.x + (vib > 0 ? (Math.random() - 0.5) * 10 * vib : 0);
    const vy = vertex.y + (vib > 0 ? (Math.random() - 0.5) * 10 * vib : 0);

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = flash > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';

    if (flash > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 24 * flash;
    }

    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(vx, vy);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.stroke();

    // Vertex Conduit Ring
    ctx.fillStyle = flash > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(vx, vy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // 4. Draw Diagnostic Core
    const core = this.physics.core;
    if (core.state !== 'discharged') {
      ctx.save();
      ctx.translate(core.x, core.y);

      // Outer glow aura
      const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, core.radius * 2);
      auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, core.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core Solid Orb
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, core.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Diagnostic Orbit Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, core.radius + Math.sin(core.hoverPhase) * 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 5. Draw Ally Nodes
    this.physics.nodes.forEach(node => {
      ctx.save();
      ctx.translate(node.x, node.y);

      // Node halo when ignited
      if (node.ignition > 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20 * node.ignition;
        ctx.beginPath();
        ctx.arc(0, 0, node.radius + node.ignition * 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Main Node Orb
      ctx.fillStyle = node.connected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = node.connected ? '#ffffff' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center Core Dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3 + node.ignition * 4, 0, Math.PI * 2);
      ctx.fill();

      // Role Label
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = node.connected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(node.role, 0, node.radius + 16);

      ctx.restore();
    });

    // 6. Draw Energy Transmission Pulses along Tethers
    this.physics.pulses.forEach(p => {
      ctx.save();
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let t = 1; t < p.trail.length; t++) {
          ctx.lineTo(p.trail[t].x, p.trail[t].y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      if (p.trail.length > 0) {
        const head = p.trail[0];
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // 7. Draw Sparks
    this.physics.sparks.forEach(sp => {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${sp.life / 0.6})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 8. Progress Matrix at bottom
    ctx.save();
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = state.allConnected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(
      `RED DE ALIADOS CONECTADA: [${state.connectedCount}/${state.totalNodes}]`,
      centerX,
      h * 0.95
    );
    ctx.restore();
  }

  // Grand Finale Typographic Reveal
  drawGrandFinale(ctx, w, h, timer) {
    const centerX = w / 2;
    const centerY = h * 0.44;

    // Smooth entry curves
    const vAlpha = Math.min(1.0, timer * 1.5);
    const acvAlpha = Math.min(1.0, Math.max(0, (timer - 1.0) * 1.5));
    const titleAlpha = Math.min(1.0, Math.max(0, (timer - 1.8) * 1.2));
    const btnAlpha = Math.min(1.0, Math.max(0, (timer - 2.5) * 1.0));

    // Cinematic monochromatic pulse
    if (timer < 1.2) {
      const flashIntensity = (1.2 - timer) * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sequence Typography: "A — C — V"
    ctx.font = '700 68px "Outfit", sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${acvAlpha})`;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 28 * acvAlpha;

    const letterSpacing = Math.min(w * 0.22, 130);

    // Letter A (slides in from left)
    const aX = centerX - letterSpacing * Math.min(1.0, (timer - 0.6) * 2.0);
    ctx.fillText('A', aX, centerY);

    // Connector dashes
    ctx.font = '300 36px "Space Grotesk", sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${acvAlpha * 0.4})`;
    ctx.fillText('—', (aX + centerX) / 2, centerY);
    ctx.fillText('—', (centerX + (centerX + letterSpacing)) / 2, centerY);

    // Letter C (center)
    ctx.font = '700 68px "Outfit", sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${acvAlpha})`;
    ctx.fillText('C', centerX, centerY);

    // Letter V (slides in from right)
    const vX = centerX + letterSpacing * Math.min(1.0, (timer - 0.6) * 2.0);
    ctx.fillText('V', vX, centerY);

    // Identity Title: "Agnostic Consulting Value"
    if (titleAlpha > 0) {
      ctx.font = '600 22px "Space Grotesk", sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${titleAlpha})`;
      ctx.shadowBlur = 12 * titleAlpha;
      ctx.fillText('Agnostic Consulting Value', centerX, centerY + 70);

      ctx.font = '400 12px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(180, 180, 190, ${titleAlpha * 0.8})`;
      ctx.shadowBlur = 0;
      ctx.fillText('TRANSFORMACIÓN DIGITAL · INNOVACIÓN · RED DE ALIADOS', centerX, centerY + 100);
    }

    // Replay / Reset Button
    if (btnAlpha > 0) {
      const btnY = h * 0.82;
      const btnW = 220;
      const btnH = 42;

      ctx.fillStyle = `rgba(255, 255, 255, ${btnAlpha * 0.1})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${btnAlpha * 0.6})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(centerX - btnW / 2, btnY - btnH / 2, btnW, btnH, 999);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(255, 255, 255, ${btnAlpha})`;
      ctx.fillText('↺ REINICIAR EXPERIENCIA (R)', centerX, btnY);
    }

    ctx.restore();
  }

  reset() {
    if (this.physics) {
      this.physics.reset();
    }
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
