/**
 * stageA.js - Stage A (Agnostic)
 *
 * 100% English.
 * - Inverted Letter 'A' ('∀') acting as an upward-facing basket/cradle.
 * - 3 floating selectable shapes (Triangle, Square, Circle) at the top.
 * - Bottom instruction text: "CHOOSE YOUR CLIENT".
 * - When dropped inside '∀', the shape settles inside the cradle.
 * - Centered overlay appears in the EXACT CENTER of the screen: "AGNOSTIC".
 * - Next stage button triggers transition to Stage C.
 */

export class StageA {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.onComplete = null;
    this.isRunning = false;
    this.animId = null;

    // Dimensions
    this.width = 0;
    this.height = 0;

    // Audio Context
    this.audioCtx = null;

    // Interactive Shapes (Clients)
    this.shapes = [];
    this.draggedShape = null;
    this.isCaptured = false;
    this.selectedShape = null;

    // Inverted Letter 'A' Basket Geometry ('∀')
    this.basket = {
      apex: { x: 0, y: 0 },
      leftTip: { x: 0, y: 0 },
      rightTip: { x: 0, y: 0 },
      crossbarY: 0,
      crossbarLeft: { x: 0, y: 0 },
      crossbarRight: { x: 0, y: 0 },
      catcherCenter: { x: 0, y: 0 },
      glow: 0
    };

    // UI & Text State
    this.bottomText = 'CHOOSE YOUR CLIENT';
    this.agnosticAlpha = 0.0;
    this.nextBtn = null;

    // Bound listeners
    this.boundResize = this.handleResize.bind(this);
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
  }

  init(container, onCompleteCallback) {
    this.container = container;
    this.onComplete = onCompleteCallback;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'stage-a-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.nextBtn = document.querySelector('#next-stage-btn');
    if (this.nextBtn) {
      this.nextBtn.classList.remove('visible');
      const label = this.nextBtn.querySelector('span:first-child');
      if (label) label.textContent = 'STAGE C';
      this.nextBtn.onclick = () => this.finishStage();
    }

    this.handleResize();
    this.initShapes();

    // Event listeners
    window.addEventListener('resize', this.boundResize);
    this.canvas.addEventListener('mousedown', this.boundPointerDown);
    window.addEventListener('mousemove', this.boundPointerMove);
    window.addEventListener('mouseup', this.boundPointerUp);
    this.canvas.addEventListener('touchstart', this.boundPointerDown, { passive: false });
    window.addEventListener('touchmove', this.boundPointerMove, { passive: false });
    window.addEventListener('touchend', this.boundPointerUp);

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.audioCtx = new AudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playGrabSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(580, this.audioCtx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.09);
  }

  playCaptureChime() {
    this.initAudio();
    if (!this.audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.06 / (i + 1), this.audioCtx.currentTime + i * 0.05 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime + i * 0.05);
      osc.stop(this.audioCtx.currentTime + 1.3);
    });
  }

  handleResize() {
    if (!this.container || !this.canvas) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.calculateInvertedABasket();
    if (!this.isCaptured) {
      this.initShapes();
    }
  }

  // Inverted Letter 'A' Basket ('∀') Geometry
  calculateInvertedABasket() {
    const cx = this.width / 2;

    // Inverted A ('∀'):
    // Apex is at the bottom
    const apexY = this.height * 0.74;
    // The two open legs branch upwards to form the basket opening
    const topTipsY = this.height * 0.44;
    const basketWidth = Math.min(this.width * 0.32, 280);

    const leftTip = { x: cx - basketWidth / 2, y: topTipsY };
    const rightTip = { x: cx + basketWidth / 2, y: topTipsY };
    const apex = { x: cx, y: apexY };

    // Crossbar connects the legs horizontally in the mid-section
    const crossbarY = apexY - (apexY - topTipsY) * 0.52;
    const t = (apexY - crossbarY) / (apexY - topTipsY);
    const crossbarLeft = { x: cx - (basketWidth / 2) * t, y: crossbarY };
    const crossbarRight = { x: cx + (basketWidth / 2) * t, y: crossbarY };

    // Catcher center is resting right on top of the crossbar inside the cradle
    const catcherCenter = {
      x: cx,
      y: crossbarY - 14
    };

    this.basket = {
      apex,
      leftTip,
      rightTip,
      crossbarY,
      crossbarLeft,
      crossbarRight,
      catcherCenter,
      glow: this.basket.glow || 0
    };
  }

  initShapes() {
    const cx = this.width / 2;
    const spawnY = this.height * 0.20;
    const spacing = Math.min(this.width * 0.22, 140);

    this.shapes = [
      {
        id: 'triangle',
        type: 'triangle',
        originX: cx - spacing,
        originY: spawnY,
        x: cx - spacing,
        y: spawnY,
        vx: 0,
        vy: 0,
        radius: 26,
        alpha: 1.0,
        scale: 1.0,
        hoverPhase: 0,
        isDragging: false
      },
      {
        id: 'square',
        type: 'square',
        originX: cx,
        originY: spawnY,
        x: cx,
        y: spawnY,
        vx: 0,
        vy: 0,
        radius: 24,
        alpha: 1.0,
        scale: 1.0,
        hoverPhase: 1.8,
        isDragging: false
      },
      {
        id: 'circle',
        type: 'circle',
        originX: cx + spacing,
        originY: spawnY,
        x: cx + spacing,
        y: spawnY,
        vx: 0,
        vy: 0,
        radius: 24,
        alpha: 1.0,
        scale: 1.0,
        hoverPhase: 3.4,
        isDragging: false
      }
    ];
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

  handlePointerDown(e) {
    if (this.isCaptured) return;
    const pos = this.getPointerPos(e);

    for (let shape of this.shapes) {
      const dist = Math.hypot(pos.x - shape.x, pos.y - shape.y);
      if (dist <= shape.radius + 14) {
        shape.isDragging = true;
        this.draggedShape = shape;
        this.playGrabSound();
        if (e.cancelable) e.preventDefault();
        break;
      }
    }
  }

  handlePointerMove(e) {
    if (!this.draggedShape) return;
    if (e.cancelable) e.preventDefault();
    const pos = this.getPointerPos(e);

    // Follow pointer with spring smoothing
    this.draggedShape.x += (pos.x - this.draggedShape.x) * 0.45;
    this.draggedShape.y += (pos.y - this.draggedShape.y) * 0.45;

    // Check proximity to Inverted 'A' Basket ('∀') for magnetic feedback
    const distToCatcher = Math.hypot(
      this.draggedShape.x - this.basket.catcherCenter.x,
      this.draggedShape.y - this.basket.catcherCenter.y
    );

    if (distToCatcher < 110) {
      this.basket.glow = Math.min(1.0, this.basket.glow + 0.1);
    } else {
      this.basket.glow = Math.max(0.0, this.basket.glow - 0.05);
    }
  }

  handlePointerUp() {
    if (!this.draggedShape) return;
    const shape = this.draggedShape;
    this.draggedShape = null;

    // Check if dropped inside the '∀' cradle
    const distToCatcher = Math.hypot(
      shape.x - this.basket.catcherCenter.x,
      shape.y - this.basket.catcherCenter.y
    );

    if (distToCatcher < 95) {
      // Shape captured inside the inverted 'A' basket!
      this.captureShape(shape);
    } else {
      // Released outside: spring return to origin
      shape.isDragging = false;
    }
  }

  captureShape(shape) {
    this.isCaptured = true;
    this.selectedShape = shape;
    shape.isDragging = false;

    // Save client choice globally for Stages C and V
    window.selectedClient = {
      type: shape.type,
      id: shape.id,
      timestamp: Date.now()
    };

    this.playCaptureChime();

    // Reveal next stage button
    if (this.nextBtn) {
      this.nextBtn.classList.add('visible');
    }
  }

  finishStage() {
    if (this.nextBtn) {
      this.nextBtn.classList.remove('visible');
    }

    if (this.onComplete) {
      this.onComplete({
        stage: 'A',
        client: window.selectedClient,
        nextStage: 'C'
      });
    }
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.draw();

    this.animId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    // 1. Update Floating / Spring Physics of Shapes
    this.shapes.forEach(shape => {
      shape.hoverPhase += dt * 2.2;

      if (this.isCaptured) {
        if (shape === this.selectedShape) {
          // Snap inside the '∀' basket cradle
          const targetX = this.basket.catcherCenter.x;
          const targetY = this.basket.catcherCenter.y;
          shape.x += (targetX - shape.x) * 0.18;
          shape.y += (targetY - shape.y) * 0.18;
          shape.scale = 1.05 + Math.sin(shape.hoverPhase) * 0.03;
        } else {
          // Fade out unselected shapes
          shape.alpha = Math.max(0, shape.alpha - dt * 2.5);
        }
      } else {
        if (!shape.isDragging) {
          const hoverY = shape.originY + Math.sin(shape.hoverPhase) * 7;
          shape.x += (shape.originX - shape.x) * 0.14;
          shape.y += (hoverY - shape.y) * 0.14;
          shape.scale = 1.0;
        } else {
          shape.scale = 1.15;
        }
      }
    });

    // 2. Basket Glow Decay
    if (!this.isCaptured) {
      this.basket.glow = Math.max(0, this.basket.glow - dt * 0.5);
    } else {
      this.basket.glow = Math.min(1.0, this.basket.glow + dt * 1.5);
    }

    // 3. Centered Overlay Fade In
    if (this.isCaptured) {
      this.agnosticAlpha = Math.min(1.0, this.agnosticAlpha + dt * 2.5);
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // 1. Clear Canvas (Pure Black)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // 2. Subtle Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 44;
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

    // 3. Draw Inverted Letter 'A' Basket ('∀')
    this.drawInvertedABasket(ctx);

    // 4. Draw Selectable Geometric Client Shapes
    this.shapes.forEach(shape => {
      if (shape.alpha > 0.01) {
        this.drawClientShape(ctx, shape);
      }
    });

    // 5. Draw Exclusive Bottom Text: "CHOOSE YOUR CLIENT"
    this.drawBottomInstruction(ctx, cx, h);

    // 6. Draw Centered Overlay ("AGNOSTIC") Floating in Exact Center of Screen
    if (this.agnosticAlpha > 0.01) {
      this.drawCenteredOverlay(ctx, cx, cy);
    }
  }

  // Draws Inverted Letter 'A' ('∀') acting as an upward cradle
  drawInvertedABasket(ctx) {
    const b = this.basket;
    const glow = b.glow;

    ctx.save();
    ctx.lineWidth = 4.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';

    if (glow > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18 * glow;
    }

    // Inverted Legs: Apex at bottom, branching upwards
    ctx.beginPath();
    ctx.moveTo(b.leftTip.x, b.leftTip.y);
    ctx.lineTo(b.apex.x, b.apex.y);
    ctx.lineTo(b.rightTip.x, b.rightTip.y);
    ctx.stroke();

    // Crossbar of '∀' (Floor of the cradle)
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(b.crossbarLeft.x, b.crossbarLeft.y);
    ctx.lineTo(b.crossbarRight.x, b.crossbarRight.y);
    ctx.stroke();

    // Apex Dot at bottom
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.apex.x, b.apex.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Catcher Guide Ring (when dragging near)
    if (glow > 0.1) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${glow * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(b.catcherCenter.x, b.catcherCenter.y, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  drawClientShape(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(s.scale, s.scale);

    const isHover = s.isDragging;
    ctx.strokeStyle = `rgba(255, 255, 255, ${s.alpha})`;
    ctx.fillStyle = isHover
      ? `rgba(255, 255, 255, ${0.25 * s.alpha})`
      : `rgba(255, 255, 255, ${0.08 * s.alpha})`;
    ctx.lineWidth = isHover ? 3.0 : 2.0;

    if (isHover || this.isCaptured) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14 * s.alpha;
    }

    if (s.type === 'triangle') {
      const r = s.radius;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.866, r * 0.5);
      ctx.lineTo(-r * 0.866, r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (s.type === 'square') {
      const size = s.radius * 1.8;
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, 4);
      ctx.fill();
      ctx.stroke();
    } else if (s.type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Small center dot
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * s.alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawBottomInstruction(ctx, cx, h) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '500 13px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.letterSpacing = '4px';
    ctx.fillText('CHOOSE YOUR CLIENT', cx, h * 0.90);
    ctx.restore();
  }

  // Exact Center Screen Overlay: "AGNOSTIC"
  drawCenteredOverlay(ctx, cx, cy) {
    const a = this.agnosticAlpha;
    ctx.save();

    // Dark semi-transparent floating backdrop card in the exact center
    const cardW = 380;
    const cardH = 100;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.82 * a})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.28 * a})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    // Centered Title "AGNOSTIC"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 36px "Space Grotesk", sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18 * a;
    ctx.letterSpacing = '6px';
    ctx.fillText('AGNOSTIC', cx, cy);

    ctx.restore();
  }

  reset() {
    this.isCaptured = false;
    this.selectedShape = null;
    window.selectedClient = null;
    this.agnosticAlpha = 0.0;
    if (this.nextBtn) this.nextBtn.classList.remove('visible');
    this.initShapes();
  }

  destroy() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('resize', this.boundResize);
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.boundPointerDown);
      window.removeEventListener('mousemove', this.boundPointerMove);
      window.removeEventListener('mouseup', this.boundPointerUp);
      this.canvas.removeEventListener('touchstart', this.boundPointerDown);
      window.removeEventListener('touchmove', this.boundPointerMove);
      window.removeEventListener('touchend', this.boundPointerUp);
      this.canvas.remove();
      this.canvas = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.ctx = null;
    this.container = null;
  }
}
