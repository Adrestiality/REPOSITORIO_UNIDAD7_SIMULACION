/**
 * stageC.js - Stage C (Consulting - Measure the Problem)
 *
 * 100% English.
 *
 * Re-designed strictly according to the reference drawing (Frames 3 & 4):
 * 1. The scale is a monumental curved 'C' / bowl settled on a small bottom base stand.
 * 2. Left platform holds the selected client (Circle = 6 pts, Triangle = 10 pts, Square = 15 pts).
 * 3. Right platform is initially empty.
 * 4. At the bottom-right, a pool of unlimited selectable geometric shapes:
 *    - Small Circle = 1 pt
 *    - Triangle     = 2 pts
 *    - Square       = 3 pts
 * 5. Player drags multiple shapes to the right platform to equal the client's weight and level the scale at 0°.
 * 6. When balanced at 0°, reveals the centered overlay: "CONSULTING".
 * 7. Exclusive bottom instruction: "MEASURE THE PROBLEM".
 */

export class StageC {
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

    // Client from Stage A
    this.client = null;
    this.clientWeight = 10; // Default: Triangle = 10 pts

    // Scale Physics & Geometry (U/C Shaped Bowl Scale from reference sketch)
    this.scaleCenter = { x: 0, y: 0 };
    this.bowlRadius = 150;
    this.bowlDepth = 120;
    this.platformArmLength = 50;

    this.tiltAngle = -0.24; // Start tilted down to the left
    this.targetAngle = -0.24;
    this.angularVelocity = 0;
    this.scaleGlow = 0;

    // Placed weights on the right platform
    this.placedWeights = [];
    this.activeDrag = null;

    // Supply sources on the bottom-right
    this.supplySources = [];

    // Progression State
    this.isBalanced = false;
    this.balanceTimer = 0;
    this.consultingAlpha = 0.0;
    this.nextBtn = null;

    // Event references
    this.boundResize = this.handleResize.bind(this);
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
  }

  init(container, onCompleteCallback) {
    this.container = container;
    this.onComplete = onCompleteCallback;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'stage-c-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.nextBtn = document.querySelector('#next-stage-btn');
    if (this.nextBtn) {
      this.nextBtn.classList.remove('visible');
      const spanText = this.nextBtn.querySelector('span:first-child');
      if (spanText) spanText.textContent = 'STAGE V';
      this.nextBtn.onclick = () => this.finishStage();
    }

    // Retrieve client selected in Stage A
    this.client = window.selectedClient || { type: 'triangle' };
    this.resolveClientWeight();

    this.handleResize();
    this.initSupplySources();

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

  resolveClientWeight() {
    const type = this.client ? this.client.type : 'triangle';
    if (type === 'circle') {
      this.clientWeight = 6;  // Circle = 6 pts
    } else if (type === 'triangle') {
      this.clientWeight = 10; // Triangle = 10 pts
    } else {
      this.clientWeight = 15; // Square = 15 pts
    }

    // Initial scale tilt according to weight
    this.targetAngle = -0.22;
    this.tiltAngle = this.targetAngle;
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

  playWeightDropSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  playBalanceHarmonic() {
    this.initAudio();
    if (!this.audioCtx) return;
    const chords = [440, 554.37, 659.25, 880]; // A Major chord
    chords.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.06 / (i + 1), this.audioCtx.currentTime + i * 0.05 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime + i * 0.05);
      osc.stop(this.audioCtx.currentTime + 1.5);
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

    const cx = this.width / 2;
    // Scale center position
    this.scaleCenter = { x: cx - 20, y: this.height * 0.44 };
    this.bowlRadius = Math.min(this.width * 0.22, 160);
    this.bowlDepth = this.bowlRadius * 0.85;

    this.initSupplySources();
  }

  // Bottom-right supply sources (Frame 3 drawing)
  initSupplySources() {
    const supplyBaseX = Math.min(this.width * 0.82, this.width - 130);
    const supplyBaseY = this.height * 0.76;

    this.supplySources = [
      {
        type: 'circle',
        weight: 1,
        radius: 15,
        x: supplyBaseX,
        y: supplyBaseY - 44,
        label: '1'
      },
      {
        type: 'triangle',
        weight: 2,
        radius: 18,
        x: supplyBaseX - 34,
        y: supplyBaseY + 6,
        label: '2'
      },
      {
        type: 'square',
        weight: 3,
        size: 26,
        radius: 17,
        x: supplyBaseX + 32,
        y: supplyBaseY + 6,
        label: '3'
      }
    ];
  }

  // Computes the left and right platform positions based on the tilt angle
  getPlatformPositions() {
    const sc = this.scaleCenter;
    const R = this.bowlRadius;
    const H = this.bowlDepth;
    const theta = this.tiltAngle;

    // In local unrotated scale coordinates:
    // Left rim top is at (-R, -H * 0.5)
    // Left platform extends horizontally outwards to (-R - platformArmLength, -H * 0.5)
    // Right rim top is at (+R, -H * 0.5)
    // Right platform extends horizontally outwards to (+R + platformArmLength, -H * 0.5)

    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    // Left Platform Center
    const localLeftX = -R - 22;
    const localLeftY = -H * 0.5;
    const leftPlatform = {
      x: sc.x + localLeftX * cos - localLeftY * sin,
      y: sc.y + localLeftX * sin + localLeftY * cos,
      angle: theta
    };

    // Right Platform Center
    const localRightX = R + 22;
    const localRightY = -H * 0.5;
    const rightPlatform = {
      x: sc.x + localRightX * cos - localRightY * sin,
      y: sc.y + localRightX * sin + localRightY * cos,
      angle: theta
    };

    return { leftPlatform, rightPlatform };
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
    if (this.isBalanced) return;
    const pos = this.getPointerPos(e);

    // 1. Check if user clicked an existing placed weight on the right platform to remove/drag it
    for (let i = this.placedWeights.length - 1; i >= 0; i--) {
      const item = this.placedWeights[i];
      if (Math.hypot(pos.x - item.x, pos.y - item.y) <= item.radius + 10) {
        this.placedWeights.splice(i, 1);
        this.recalculateScaleTorque();

        this.activeDrag = {
          type: item.type,
          weight: item.weight,
          radius: item.radius,
          size: item.size,
          x: pos.x,
          y: pos.y,
          wasOnPlatform: true
        };

        if (e.cancelable) e.preventDefault();
        return;
      }
    }

    // 2. Check if user clicked any of the 3 supply sources to spawn a new weight
    for (let src of this.supplySources) {
      if (Math.hypot(pos.x - src.x, pos.y - src.y) <= src.radius + 14) {
        this.activeDrag = {
          type: src.type,
          weight: src.weight,
          radius: src.radius,
          size: src.size,
          x: pos.x,
          y: pos.y,
          wasOnPlatform: false
        };

        if (e.cancelable) e.preventDefault();
        return;
      }
    }
  }

  handlePointerMove(e) {
    if (!this.activeDrag) return;
    if (e.cancelable) e.preventDefault();
    const pos = this.getPointerPos(e);

    this.activeDrag.x += (pos.x - this.activeDrag.x) * 0.55;
    this.activeDrag.y += (pos.y - this.activeDrag.y) * 0.55;
  }

  handlePointerUp() {
    if (!this.activeDrag) return;
    const item = this.activeDrag;
    this.activeDrag = null;

    const { rightPlatform } = this.getPlatformPositions();
    const distToRightPlatform = Math.hypot(item.x - rightPlatform.x, item.y - rightPlatform.y);

    if (distToRightPlatform <= 85) {
      // Successfully dropped onto the right platform
      this.placedWeights.push({
        id: Math.random().toString(),
        type: item.type,
        weight: item.weight,
        radius: item.radius,
        size: item.size,
        x: item.x,
        y: item.y
      });

      this.playWeightDropSound();
      this.recalculateScaleTorque();
    }
    // If dropped elsewhere, it is simply discarded/returned
  }

  recalculateScaleTorque() {
    const totalPlacedWeight = this.placedWeights.reduce((sum, item) => sum + item.weight, 0);
    const netDifference = totalPlacedWeight - this.clientWeight;

    // Angle mapping:
    // net < 0 -> left tilted down (negative angle)
    // net = 0 -> balanced horizontal (0 angle)
    // net > 0 -> right tilted down (positive angle)
    // 0.035 rad per point of difference, clamped to [-0.25, +0.25] rad (~14 deg)
    this.targetAngle = Math.max(-0.25, Math.min(0.25, netDifference * 0.035));
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
    // 1. Spring-Damper Physics for the Rocking 'C' Scale
    const springK = 0.12;
    const damping = 0.88;
    const force = (this.targetAngle - this.tiltAngle) * springK;

    this.angularVelocity = (this.angularVelocity + force) * damping;
    this.tiltAngle += this.angularVelocity;

    // 2. Position Placed Weights Neatly on the Right Platform
    const { rightPlatform } = this.getPlatformPositions();
    const total = this.placedWeights.length;

    this.placedWeights.forEach((item, index) => {
      // Arrange side-by-side or stacked on the tray
      const row = Math.floor(index / 4);
      const col = index % 4;
      const countInRow = Math.min(4, total - row * 4);
      const offsetX = (col - (countInRow - 1) / 2) * 26;
      const offsetY = -16 - row * 26;

      const cos = Math.cos(rightPlatform.angle);
      const sin = Math.sin(rightPlatform.angle);
      const targetX = rightPlatform.x + offsetX * cos - offsetY * sin;
      const targetY = rightPlatform.y + offsetX * sin + offsetY * cos;

      item.x += (targetX - item.x) * 0.28;
      item.y += (targetY - item.y) * 0.28;
    });

    // 3. Equilibrium Check (0° horizontal)
    const totalPlacedWeight = this.placedWeights.reduce((sum, item) => sum + item.weight, 0);
    const isWeightEqual = totalPlacedWeight === this.clientWeight;
    const isNearlyHorizontal = Math.abs(this.tiltAngle) < 0.008 && Math.abs(this.angularVelocity) < 0.003;

    if (isWeightEqual && isNearlyHorizontal) {
      this.balanceTimer += dt;
      this.scaleGlow = Math.min(1.0, this.scaleGlow + dt * 2.0);

      if (this.balanceTimer >= 0.40 && !this.isBalanced) {
        this.isBalanced = true;
        this.playBalanceHarmonic();
        if (this.nextBtn) this.nextBtn.classList.add('visible');
      }
    } else {
      this.balanceTimer = Math.max(0, this.balanceTimer - dt * 2.5);
      this.scaleGlow = Math.max(0, this.scaleGlow - dt * 1.5);
    }

    // 4. Centered Overlay Fade In
    if (this.isBalanced) {
      this.consultingAlpha = Math.min(1.0, this.consultingAlpha + dt * 2.5);
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // 1. Clear Screen (Pure Black)
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

    // 3. Draw Bottom Pedestal / Stand
    this.drawPedestal(ctx);

    // 4. Draw The Monumental Letter 'C' Scale Body (Frames 3 & 4)
    this.drawCScaleBody(ctx);

    // 5. Draw Client on Left Platform
    this.drawClientOnLeftPlatform(ctx);

    // 6. Draw Placed Counterweights on Right Platform
    this.drawPlacedWeights(ctx);

    // 7. Draw Bottom-Right Supply Sources (Frames 3 & 4)
    this.drawSupplySources(ctx);

    // 8. Draw Active Dragging Weight (if any)
    if (this.activeDrag) {
      this.drawSingleShape(ctx, this.activeDrag.x, this.activeDrag.y, this.activeDrag, true);
    }

    // 9. Exclusive Bottom Instruction: "MEASURE THE PROBLEM"
    this.drawBottomInstruction(ctx, cx, h);

    // 10. Exact Center Screen Overlay: "CONSULTING"
    if (this.consultingAlpha > 0.01) {
      this.drawCenteredOverlay(ctx, cx, cy);
    }
  }

  // Draw Bottom Trapezoidal Stand Base under the 'C' bowl
  drawPedestal(ctx) {
    const sc = this.scaleCenter;
    const H = this.bowlDepth;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;

    // Base pedestal sitting on the floor
    const baseY = sc.y + H * 0.5 + 8;
    const topW = 48;
    const botW = 90;
    const pedH = 16;

    ctx.beginPath();
    ctx.moveTo(sc.x - topW / 2, baseY);
    ctx.lineTo(sc.x + topW / 2, baseY);
    ctx.lineTo(sc.x + botW / 2, baseY + pedH);
    ctx.lineTo(sc.x - botW / 2, baseY + pedH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Draws the monumental 'C' / bowl scale body according to Frame 3 & 4
  drawCScaleBody(ctx) {
    const sc = this.scaleCenter;
    const R = this.bowlRadius;
    const H = this.bowlDepth;
    const arm = this.platformArmLength;
    const theta = this.tiltAngle;
    const glow = this.scaleGlow;

    ctx.save();
    ctx.translate(sc.x, sc.y);
    ctx.rotate(theta);

    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';

    if (glow > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 24 * glow;
    }

    // Main U/C-shaped curved rocker bowl:
    // Curves from left rim (-R, -H*0.5) down through bottom center (0, +H*0.5) to right rim (+R, -H*0.5)
    ctx.beginPath();
    ctx.moveTo(-R, -H * 0.5);
    ctx.bezierCurveTo(-R, H * 0.65, R, H * 0.65, R, -H * 0.5);
    ctx.stroke();

    // Left horizontal platform tray extending outwards
    ctx.beginPath();
    ctx.moveTo(-R + 4, -H * 0.5);
    ctx.lineTo(-R - arm, -H * 0.5);
    ctx.stroke();

    // Right horizontal platform tray extending outwards
    ctx.beginPath();
    ctx.moveTo(R - 4, -H * 0.5);
    ctx.lineTo(R + arm, -H * 0.5);
    ctx.stroke();

    // Subtle inner contour line for typographic letterform depth
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(-R + 10, -H * 0.45);
    ctx.bezierCurveTo(-R + 12, H * 0.55, R - 12, H * 0.55, R - 10, -H * 0.45);
    ctx.stroke();

    ctx.restore();
  }

  // Draw the selected client figure sitting on the left platform
  drawClientOnLeftPlatform(ctx) {
    const { leftPlatform } = this.getPlatformPositions();
    const type = this.client ? this.client.type : 'triangle';

    ctx.save();
    ctx.translate(leftPlatform.x, leftPlatform.y - 18);
    ctx.rotate(leftPlatform.angle);

    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;

    if (type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (type === 'square') {
      const s = 34;
      ctx.beginPath();
      ctx.roundRect(-s / 2, -s / 2, s, s, 3);
      ctx.fill();
      ctx.stroke();
    } else {
      // Triangle
      const r = 24;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.866, r * 0.5);
      ctx.lineTo(-r * 0.866, r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw all counterweights placed on the right platform
  drawPlacedWeights(ctx) {
    this.placedWeights.forEach(item => {
      this.drawSingleShape(ctx, item.x, item.y, item, false);
    });
  }

  // Draw the 3 supply sources in bottom-right (Circle, Triangle, Square as in Frame 3)
  drawSupplySources(ctx) {
    ctx.save();

    // Draw the 3 sources
    this.supplySources.forEach(src => {
      this.drawSingleShape(ctx, src.x, src.y, src, false);
    });

    ctx.restore();
  }

  // Utility to draw a single geometric shape (Circle, Triangle, Square)
  drawSingleShape(ctx, x, y, shape, isDragging) {
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = isDragging
      ? 'rgba(255, 255, 255, 0.35)'
      : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = isDragging ? 2.5 : 2.0;

    if (isDragging || this.isBalanced) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
    }

    if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, shape.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (shape.type === 'square') {
      const s = shape.size || shape.radius * 1.5;
      ctx.beginPath();
      ctx.roundRect(-s / 2, -s / 2, s, s, 3);
      ctx.fill();
      ctx.stroke();
    } else if (shape.type === 'triangle') {
      const r = shape.radius;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.866, r * 0.5);
      ctx.lineTo(-r * 0.866, r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  drawBottomInstruction(ctx, cx, h) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '500 13px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.letterSpacing = '4px';
    ctx.fillText('MEASURE THE PROBLEM', cx, h * 0.90);
    ctx.restore();
  }

  // Exact Center Screen Overlay: "CONSULTING" (Frame 4)
  drawCenteredOverlay(ctx, cx, cy) {
    const a = this.consultingAlpha;
    ctx.save();

    const cardW = 380;
    const cardH = 100;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.82 * a})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.28 * a})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 36px "Space Grotesk", sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18 * a;
    ctx.letterSpacing = '6px';
    ctx.fillText('CONSULTING', cx, cy);

    ctx.restore();
  }

  finishStage() {
    if (this.nextBtn) {
      this.nextBtn.classList.remove('visible');
    }

    if (this.onComplete) {
      this.onComplete({
        stage: 'C',
        client: this.client,
        nextStage: 'V'
      });
    }
  }

  reset() {
    this.isBalanced = false;
    this.balanceTimer = 0;
    this.consultingAlpha = 0.0;
    this.scaleGlow = 0;
    this.placedWeights = [];
    this.activeDrag = null;
    if (this.nextBtn) this.nextBtn.classList.remove('visible');
    this.resolveClientWeight();
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
