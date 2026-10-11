/**
 * stageV.js - Stage V (Value - Strategic Alliance) & ACV Grand Finale
 *
 * 100% English.
 * Critical corrections based on Illustrationm.jpg:
 * 1. Asymmetric & Inclined 'V' Letterform:
 *    - Left arm originates high up on the left (where client rests).
 *    - Right arm terminates noticeably lower on the right (where ally rests).
 *    - Steep downward gravity slope from left to right.
 * 2. Single Ally Receptor on Right Platform with Up / Down Selector Arrows:
 *    - Single ally displayed on the platform.
 *    - Clickable Up (▲) and Down (▼) arrows to cycle between Circle, Triangle, and Square.
 * 3. Drag & Drop Bridge Mechanics:
 *    - Click and drag from client (left) to selected ally (right).
 *    - When connected, bridge adopts geometry according to the ally shape:
 *      * Circle Ally   -> Smooth Curve / Ramp (Curva / rampa suave).
 *      * Square Ally   -> Stepped Square Staircase (Escalera cuadrada / escalonada).
 *      * Triangle Ally -> Zig-Zag / Triangular Teeth (Dientes triangulares).
 * 4. Compatibility & Fall Physics:
 *    - Correct pairs:
 *      * Triangle Client -> Circle Ally (Smooth curve/ramp).
 *      * Square Client   -> Triangle Ally (Triangular teeth/zig-zag).
 *      * Circle Client   -> Square Ally (Square staircase).
 *    - If incorrect: Figure attempts to cross, loses grip midway, and falls into
 *      the deep apex of the 'V', shakes, and respawns safely on the left ledge.
 *    - If correct: Figure happily descends along bridge structure and unites with ally.
 * 5. Finale Screen:
 *    - Centered "VALUE" overlay card in exact center of the screen.
 *    - Grand Finale: "A · C · V" -> "AGNOSTIC CONSULTING VALUE" -> "↺ PLAY AGAIN".
 */

export class StageV {
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
    this.correctAllyType = 'circle';

    // Ally Selector State (Circle, Triangle, Square)
    this.allyOptions = ['circle', 'triangle', 'square'];
    this.selectedAllyIndex = 1; // Initialized to a non-matching option to encourage interaction
    this.allySwitchAnim = 0; // Quick bounce animation on change

    // Positions & Geometry
    this.cliffLeft = { x: 0, y: 0, width: 76 };
    this.vAbyss = {
      leftRim: { x: 0, y: 0 },
      apex: { x: 0, y: 0 },
      rightRim: { x: 0, y: 0 }
    };
    this.rightPlatform = { x: 0, y: 0, width: 76 };

    // Arrow button hitboxes
    this.upArrowBounds = { x: 0, y: 0, r: 24 };
    this.downArrowBounds = { x: 0, y: 0, r: 24 };
    this.hoverTarget = null; // 'up' | 'down' | 'client' | 'ally' | null

    // Client Avatar
    this.clientAvatar = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      startX: 0,
      startY: 0,
      rotation: 0,
      state: 'idle', // 'idle' | 'crossing' | 'falling' | 'stuck' | 'returning' | 'completed'
      progress: 0,
      stuckTimer: 0,
      opacity: 1.0
    };

    // Active Bridge State
    this.bridge = {
      active: false,
      isCorrect: false,
      targetAllyType: 'triangle',
      buildProgress: 0,
      alpha: 1.0
    };

    // Interaction
    this.isDragging = false;
    this.pointerPos = { x: 0, y: 0 };

    // Progression & Overlays
    this.hasCrossed = false;
    this.valueAlpha = 0.0;
    this.sparks = [];

    // Grand Finale Screen State
    this.isGrandFinale = false;
    this.finaleTimer = 0;
    this.playAgainBtnBounds = { x: 0, y: 0, w: 200, h: 44 };

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
    this.canvas.id = 'stage-v-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    const nextBtn = document.querySelector('#next-stage-btn');
    if (nextBtn) nextBtn.classList.remove('visible');

    // Retrieve client from Stage A (Circle, Triangle, or Square)
    this.client = window.selectedClient || { type: 'triangle' };
    this.resolveCorrectAlly();

    // Start with an ally index that is different from correct to require player action
    const correctIdx = this.allyOptions.indexOf(this.correctAllyType);
    this.selectedAllyIndex = (correctIdx + 1) % this.allyOptions.length;

    this.handleResize();
    this.resetClientAvatar();

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

  resolveCorrectAlly() {
    const type = this.client ? this.client.type : 'triangle';
    if (type === 'triangle') {
      this.correctAllyType = 'circle'; // Triangle client -> Circle ally (smooth curve ramp)
    } else if (type === 'square') {
      this.correctAllyType = 'triangle'; // Square client -> Triangle ally (triangular teeth)
    } else {
      this.correctAllyType = 'square'; // Circle client -> Square ally (square staircase)
    }
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

  playClickSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(840, this.audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.06);
  }

  playErrorSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(65, this.audioCtx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.30);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.31);
  }

  playSuccessSound() {
    this.initAudio();
    if (!this.audioCtx) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + i * 0.06);

      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.06 / (i + 1), this.audioCtx.currentTime + i * 0.06 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime + i * 0.06);
      osc.stop(this.audioCtx.currentTime + 1.9);
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

    // 1. Asymmetric Inclined 'V' Geometry:
    // Left arm starts high up on the left (height * 0.28)
    // Apex sinks deep in the lower middle (height * 0.80)
    // Right arm terminates NOTICEABLY LOWER on the right (height * 0.54)
    const leftX = this.width * 0.16;
    const leftY = this.height * 0.28;

    const rightX = this.width * 0.82;
    const rightY = this.height * 0.54;

    const apexX = this.width * 0.46;
    const apexY = this.height * 0.80;

    this.cliffLeft = {
      x: leftX,
      y: leftY,
      width: 74
    };

    this.rightPlatform = {
      x: rightX,
      y: rightY,
      width: 74
    };

    this.vAbyss = {
      leftRim: { x: leftX + 16, y: leftY },
      apex: { x: apexX, y: apexY },
      rightRim: { x: rightX - 16, y: rightY }
    };

    // Button hitboxes on right platform
    const allyCenterY = rightY - 22;
    this.upArrowBounds = { x: rightX, y: allyCenterY - 32, r: 24 };
    this.downArrowBounds = { x: rightX, y: rightY + 22, r: 24 };

    if (this.clientAvatar.state === 'idle') {
      this.resetClientAvatar();
    }
  }

  resetClientAvatar() {
    this.clientAvatar.x = this.cliffLeft.x;
    this.clientAvatar.y = this.cliffLeft.y - 18;
    this.clientAvatar.startX = this.cliffLeft.x;
    this.clientAvatar.startY = this.cliffLeft.y - 18;
    this.clientAvatar.vx = 0;
    this.clientAvatar.vy = 0;
    this.clientAvatar.state = 'idle';
    this.clientAvatar.progress = 0;
    this.clientAvatar.stuckTimer = 0;
    this.clientAvatar.rotation = 0;
    this.clientAvatar.opacity = 1.0;
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
    const pos = this.getPointerPos(e);

    // Grand Finale screen: "PLAY AGAIN" button click
    if (this.isGrandFinale && this.finaleTimer > 1.8) {
      const b = this.playAgainBtnBounds;
      if (
        pos.x >= b.x - b.w / 2 &&
        pos.x <= b.x + b.w / 2 &&
        pos.y >= b.y - b.h / 2 &&
        pos.y <= b.y + b.h / 2
      ) {
        this.restartExperience();
        return;
      }
    }

    if (this.hasCrossed) return;

    // 1. Check Up Arrow click
    const distUp = Math.hypot(pos.x - this.upArrowBounds.x, pos.y - this.upArrowBounds.y);
    if (distUp <= this.upArrowBounds.r) {
      if (this.clientAvatar.state === 'idle') {
        this.cycleAlly(-1);
      }
      if (e.cancelable) e.preventDefault();
      return;
    }

    // 2. Check Down Arrow click
    const distDown = Math.hypot(pos.x - this.downArrowBounds.x, pos.y - this.downArrowBounds.y);
    if (distDown <= this.downArrowBounds.r) {
      if (this.clientAvatar.state === 'idle') {
        this.cycleAlly(1);
      }
      if (e.cancelable) e.preventDefault();
      return;
    }

    // 3. Direct click on Ally shape to cycle
    const allyCenterY = this.rightPlatform.y - 22;
    const distAlly = Math.hypot(pos.x - this.rightPlatform.x, pos.y - allyCenterY);
    if (distAlly <= 26 && this.clientAvatar.state === 'idle') {
      this.cycleAlly(1);
      if (e.cancelable) e.preventDefault();
      return;
    }

    if (this.clientAvatar.state !== 'idle') return;

    // 4. Start Drag from client figure
    const distClient = Math.hypot(pos.x - this.clientAvatar.x, pos.y - this.clientAvatar.y);
    if (distClient <= 44) {
      this.isDragging = true;
      this.pointerPos = pos;
      if (e.cancelable) e.preventDefault();
      return;
    }
  }

  handlePointerMove(e) {
    const pos = this.getPointerPos(e);
    this.updateHoverTarget(pos);

    if (!this.isDragging) return;
    if (e.cancelable) e.preventDefault();
    this.pointerPos = pos;
  }

  handlePointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;

    // Check if released near the right platform / ally
    const allyCenterY = this.rightPlatform.y - 22;
    const distToAlly = Math.hypot(this.pointerPos.x - this.rightPlatform.x, this.pointerPos.y - allyCenterY);

    if (distToAlly < 65) {
      this.connectBridge();
    }
  }

  updateHoverTarget(pos) {
    if (this.isGrandFinale) {
      this.hoverTarget = null;
      return;
    }

    const distUp = Math.hypot(pos.x - this.upArrowBounds.x, pos.y - this.upArrowBounds.y);
    if (distUp <= this.upArrowBounds.r) {
      this.hoverTarget = 'up';
      return;
    }

    const distDown = Math.hypot(pos.x - this.downArrowBounds.x, pos.y - this.downArrowBounds.y);
    if (distDown <= this.downArrowBounds.r) {
      this.hoverTarget = 'down';
      return;
    }

    const distClient = Math.hypot(pos.x - this.clientAvatar.x, pos.y - this.clientAvatar.y);
    if (distClient <= 32) {
      this.hoverTarget = 'client';
      return;
    }

    const allyCenterY = this.rightPlatform.y - 22;
    const distAlly = Math.hypot(pos.x - this.rightPlatform.x, pos.y - allyCenterY);
    if (distAlly <= 30) {
      this.hoverTarget = 'ally';
      return;
    }

    this.hoverTarget = null;
  }

  cycleAlly(dir) {
    const len = this.allyOptions.length;
    this.selectedAllyIndex = (this.selectedAllyIndex + dir + len) % len;
    this.allySwitchAnim = 1.0;
    this.playClickSound();

    // If an old bridge was drawn, dissolve it
    this.bridge.active = false;
  }

  connectBridge() {
    const currentAlly = this.allyOptions[this.selectedAllyIndex];
    const isCorrect = currentAlly === this.correctAllyType;

    this.bridge = {
      active: true,
      isCorrect,
      targetAllyType: currentAlly,
      buildProgress: 0,
      alpha: 1.0
    };

    // Client starts crossing down the bridge
    this.clientAvatar.state = 'crossing';
    this.clientAvatar.progress = 0;
    this.clientAvatar.startX = this.cliffLeft.x;
    this.clientAvatar.startY = this.cliffLeft.y - 18;
    this.clientAvatar.rotation = 0;
  }

  // Calculates parametric position (x, y, rotation) along the bridge profile at progress t [0, 1]
  getBridgeCoordinates(t, allyType) {
    const startX = this.cliffLeft.x + this.cliffLeft.width / 2;
    const startY = this.cliffLeft.y;
    const endX = this.rightPlatform.x - this.rightPlatform.width / 2;
    const endY = this.rightPlatform.y;

    if (allyType === 'circle') {
      // 1. CURVE / RAMPA SUAVE (Smooth parabolic curve / ramp)
      const midX = (startX + endX) * 0.5;
      const midY = (startY + endY) * 0.5 + 32; // Natural gravitational catenary sag

      const oneMinusT = 1 - t;
      const x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * midX + t * t * endX;
      const y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * midY + t * t * endY;

      // Tangent derivative for rolling rotation
      const dx = 2 * oneMinusT * (midX - startX) + 2 * t * (endX - midX);
      const dy = 2 * oneMinusT * (midY - startY) + 2 * t * (endY - midY);
      const rot = Math.atan2(dy, dx);

      return { x, y, rot };
    } else if (allyType === 'square') {
      // 2. ESCALERA CUADRADA / ESCALONADA (Stepped square staircase)
      const steps = 8;
      const s = Math.max(0, Math.min(1, t)) * steps;
      const stepIdx = Math.min(steps - 1, Math.floor(s));
      const subT = s - stepIdx;

      const dx = (endX - startX) / steps;
      const dy = (endY - startY) / steps;

      if (subT < 0.70) {
        // Horizontal tread
        const treadT = subT / 0.70;
        return {
          x: startX + (stepIdx + treadT) * dx,
          y: startY + stepIdx * dy,
          rot: 0
        };
      } else {
        // Vertical drop (riser)
        const riserT = (subT - 0.70) / 0.30;
        return {
          x: startX + (stepIdx + 1) * dx,
          y: startY + (stepIdx + riserT) * dy,
          rot: riserT * 0.25
        };
      }
    } else {
      // 3. ZIG-ZAG / DIENTES TRIANGULARES (Triangular teeth)
      const teeth = 8;
      const s = Math.max(0, Math.min(1, t)) * teeth;
      const toothIdx = Math.min(teeth - 1, Math.floor(s));
      const subT = s - toothIdx;

      const toothWidth = (endX - startX) / teeth;
      const toothHeight = 16;

      let x, y, rot;
      if (subT < 0.5) {
        // Rising to tooth peak
        const norm = subT / 0.5;
        x = startX + (toothIdx + subT) * toothWidth;
        const baseY = startY + (endY - startY) * ((x - startX) / (endX - startX));
        y = baseY - norm * toothHeight;
        rot = -0.32;
      } else {
        // Falling down tooth valley
        const norm = (subT - 0.5) / 0.5;
        x = startX + (toothIdx + subT) * toothWidth;
        const baseY = startY + (endY - startY) * ((x - startX) / (endX - startX));
        y = baseY - (1 - norm) * toothHeight;
        rot = 0.32;
      }

      return { x, y, rot };
    }
  }

  // Returns the Y-coordinate on the diagonal walls of the 'V' for a given X
  getVAbyssY(x) {
    const v = this.vAbyss;
    if (x <= v.apex.x) {
      // Left diagonal wall
      const t = (x - v.leftRim.x) / (v.apex.x - v.leftRim.x);
      return v.leftRim.y + (v.apex.y - v.leftRim.y) * Math.max(0, Math.min(1, t));
    } else {
      // Right diagonal wall
      const t = (x - v.apex.x) / (v.rightRim.x - v.apex.x);
      return v.apex.y + (v.rightRim.y - v.apex.y) * Math.max(0, Math.min(1, t));
    }
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min(0.08, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.draw();

    this.animId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    // 1. Ally switch bounce animation
    if (this.allySwitchAnim > 0) {
      this.allySwitchAnim = Math.max(0, this.allySwitchAnim - dt * 4.5);
    }

    // 2. Bridge construction animation
    if (this.bridge.active) {
      this.bridge.buildProgress = Math.min(1.0, this.bridge.buildProgress + dt * 3.2);
    }

    // 3. Client trajectory & physics update
    const ca = this.clientAvatar;

    if (ca.state === 'crossing') {
      const isCorrect = this.bridge.isCorrect;
      const speed = isCorrect ? 0.65 : 0.45;
      ca.progress += dt * speed;

      if (!isCorrect && ca.progress >= 0.36) {
        // INCOMPATIBLE ALLY: Loses grip and falls into the deep apex of the 'V'!
        ca.state = 'falling';
        ca.vx = 45;
        ca.vy = 80;
        this.playErrorSound();
      } else if (isCorrect && ca.progress >= 1.0) {
        // CORRECT ALLY: Successfully arrives at destination!
        ca.progress = 1.0;
        ca.state = 'completed';
        this.hasCrossed = true;
        this.playSuccessSound();

        // Celebration spark burst
        const destX = this.rightPlatform.x;
        const destY = this.rightPlatform.y - 22;
        for (let i = 0; i < 28; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 2.0 + Math.random() * 5.0;
          this.sparks.push({
            x: destX,
            y: destY,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 1.0
          });
        }
      }

      if (ca.state === 'crossing') {
        const coords = this.getBridgeCoordinates(ca.progress, this.bridge.targetAllyType);
        ca.x = coords.x;
        ca.y = coords.y - 18;
        ca.rotation = coords.rot;
      }
    } else if (ca.state === 'falling') {
      // Downward gravity acceleration towards the apex of the 'V'
      ca.vy += 850 * dt;
      ca.x += ca.vx * dt;
      ca.y += ca.vy * dt;
      ca.rotation += 7.0 * dt;

      const targetFloorY = this.vAbyss.apex.y - 14;
      if (ca.y >= targetFloorY) {
        ca.y = targetFloorY;
        ca.vy = -ca.vy * 0.22; // Small elastic bounce
        ca.vx = 0;

        if (Math.abs(ca.vy) < 40) {
          ca.state = 'stuck';
          ca.stuckTimer = 0;
        }
      }
    } else if (ca.state === 'stuck') {
      // Wobbles and shakes at the bottom of the V due to incompatibility
      ca.stuckTimer += dt;
      ca.x = this.vAbyss.apex.x + Math.sin(ca.stuckTimer * 38) * 3.5;
      ca.rotation = Math.sin(ca.stuckTimer * 28) * 0.2;

      // After 0.85s, dissolves and safely respawns back on the left ledge
      if (ca.stuckTimer > 0.85) {
        ca.opacity = Math.max(0, ca.opacity - dt * 3.0);
        this.bridge.alpha = Math.max(0, this.bridge.alpha - dt * 3.0);

        if (ca.opacity <= 0) {
          this.resetClientAvatar();
          this.bridge.active = false;
        }
      }
    }

    // 4. Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= dt * 1.6;
      sp.x += sp.vx;
      sp.y += sp.vy;
      if (sp.life <= 0) this.sparks.splice(i, 1);
    }

    // 5. Centered "VALUE" Overlay Transition & Grand Finale
    if (this.hasCrossed) {
      this.valueAlpha = Math.min(1.0, this.valueAlpha + dt * 2.5);

      if (this.valueAlpha >= 1.0) {
        this.finaleTimer += dt;
        if (this.finaleTimer > 1.8 && !this.isGrandFinale) {
          this.isGrandFinale = true;
        }
      }
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

    // Grand Finale Screen: "A C V"
    if (this.isGrandFinale) {
      this.drawGrandFinale(ctx, w, h);
      return;
    }

    // 3. Draw Monumental Asymmetric & Inclined 'V' Letterform
    this.drawAsymmetricVAbyss(ctx);

    // 4. Draw Left Cliff (Higher)
    this.drawLeftCliff(ctx);

    // 5. Draw Right Platform (Lower) with Single Ally Receptor & Arrow Selectors
    this.drawRightPlatformWithSelector(ctx);

    // 6. Draw Bridge with Geometric Profile Anchored on the 'V'
    if (this.bridge.active) {
      this.drawStructuredBridge(ctx);
    }

    // 7. Draw Drag Guide Line
    if (this.isDragging) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.clientAvatar.x, this.clientAvatar.y);
      ctx.lineTo(this.pointerPos.x, this.pointerPos.y);
      ctx.stroke();
      ctx.restore();
    }

    // 8. Draw Client Avatar Following Bridge
    this.drawClientAvatar(ctx);

    // 9. Draw Sparks
    this.sparks.forEach(sp => {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${sp.life})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 10. Bottom Instruction: "FIND YOUR ALLY"
    this.drawBottomInstruction(ctx, cx, h);

    // 11. Centered Overlay ("VALUE") Floating in Exact Center of Screen
    if (this.valueAlpha > 0.01 && !this.isGrandFinale) {
      this.drawCenteredOverlay(ctx, cx, cy);
    }
  }

  // Draws the monumental Asymmetric & Inclined 'V'
  drawAsymmetricVAbyss(ctx) {
    const v = this.vAbyss;

    ctx.save();
    ctx.lineWidth = 5.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';

    // Main V lines: Left rim (high) -> Apex (bottom) -> Right rim (lower)
    ctx.beginPath();
    ctx.moveTo(v.leftRim.x, v.leftRim.y);
    ctx.lineTo(v.apex.x, v.apex.y);
    ctx.lineTo(v.rightRim.x, v.rightRim.y);
    ctx.stroke();

    // Apex Dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(v.apex.x, v.apex.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Structural Foundation Trusses under the V walls
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;

    // Left wall foundation ticks
    for (let t = 0.12; t <= 0.88; t += 0.11) {
      const lx = v.leftRim.x + (v.apex.x - v.leftRim.x) * t;
      const ly = v.leftRim.y + (v.apex.y - v.leftRim.y) * t;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - 12, ly + 14);
      ctx.stroke();
    }

    // Right wall foundation ticks
    for (let t = 0.12; t <= 0.88; t += 0.13) {
      const rx = v.apex.x + (v.rightRim.x - v.apex.x) * t;
      const ry = v.apex.y + (v.rightRim.y - v.apex.y) * t;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 12, ry + 14);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawLeftCliff(ctx) {
    const c = this.cliffLeft;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';

    // Platform ledge
    ctx.beginPath();
    ctx.moveTo(c.x - c.width / 2, c.y);
    ctx.lineTo(c.x + c.width / 2, c.y);
    ctx.stroke();

    // Ledge support bracket
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c.x - c.width / 2, c.y);
    ctx.lineTo(c.x - c.width / 2 + 16, c.y + 22);
    ctx.stroke();

    ctx.restore();
  }

  // Draws single ally receptor on the right platform with Up & Down selector arrows
  drawRightPlatformWithSelector(ctx) {
    const p = this.rightPlatform;
    const currentAlly = this.allyOptions[this.selectedAllyIndex];
    const allyY = p.y - 22;

    ctx.save();

    // 1. Platform shelf line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x - p.width / 2, p.y);
    ctx.lineTo(p.x + p.width / 2, p.y);
    ctx.stroke();

    // Shelf support
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x + p.width / 2, p.y);
    ctx.lineTo(p.x + p.width / 2 - 16, p.y + 22);
    ctx.stroke();

    // 2. Up Arrow Button (▲)
    const isUpHover = this.hoverTarget === 'up';
    ctx.save();
    ctx.translate(p.x, allyY - 30);
    ctx.strokeStyle = isUpHover ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
    ctx.fillStyle = isUpHover ? '#ffffff' : 'transparent';
    ctx.lineWidth = isUpHover ? 2.5 : 2.0;
    if (isUpHover) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
    }

    // Minimalist crisp chevron pointing up
    ctx.beginPath();
    ctx.moveTo(-9, 5);
    ctx.lineTo(0, -5);
    ctx.lineTo(9, 5);
    ctx.stroke();
    ctx.restore();

    // 3. Down Arrow Button (▼)
    const isDownHover = this.hoverTarget === 'down';
    ctx.save();
    ctx.translate(p.x, p.y + 20);
    ctx.strokeStyle = isDownHover ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
    ctx.fillStyle = isDownHover ? '#ffffff' : 'transparent';
    ctx.lineWidth = isDownHover ? 2.5 : 2.0;
    if (isDownHover) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
    }

    // Minimalist crisp chevron pointing down
    ctx.beginPath();
    ctx.moveTo(-9, -5);
    ctx.lineTo(0, 5);
    ctx.lineTo(9, -5);
    ctx.stroke();
    ctx.restore();

    // 4. Ally Receptor Figure on Platform
    const bounceScale = 1.0 + this.allySwitchAnim * 0.22;
    ctx.save();
    ctx.translate(p.x, allyY);
    ctx.scale(bounceScale, bounceScale);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;

    if (currentAlly === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (currentAlly === 'square') {
      const s = 26;
      ctx.beginPath();
      ctx.roundRect(-s / 2, -s / 2, s, s, 3);
      ctx.fill();
      ctx.stroke();
    } else if (currentAlly === 'triangle') {
      const r = 18;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.866, r * 0.5);
      ctx.lineTo(-r * 0.866, r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Drag proximity highlight ring
    if (this.isDragging) {
      const dist = Math.hypot(this.pointerPos.x - p.x, this.pointerPos.y - allyY);
      if (dist < 65) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();

    ctx.restore();
  }

  // Draws structured bridge anchored onto the walls of the 'V'
  drawStructuredBridge(ctx) {
    const b = this.bridge;
    const startX = this.cliffLeft.x + this.cliffLeft.width / 2;
    const startY = this.cliffLeft.y;
    const endX = this.rightPlatform.x - this.rightPlatform.width / 2;
    const endY = this.rightPlatform.y;
    const prog = b.buildProgress;
    const alpha = b.alpha;

    ctx.save();
    ctx.strokeStyle = b.isCorrect
      ? `rgba(255, 255, 255, ${alpha})`
      : `rgba(255, 255, 255, ${0.45 * alpha})`;
    ctx.lineWidth = 2.5;

    if (b.isCorrect) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
    }

    if (b.targetAllyType === 'circle') {
      // 1. CURVE / RAMPA SUAVE (for Circle Ally)
      const midX = (startX + endX) * 0.5;
      const midY = (startY + endY) * 0.5 + 32;

      ctx.beginPath();
      const numSegments = 40;
      for (let i = 0; i <= numSegments * prog; i++) {
        const t = i / numSegments;
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * midX + t * t * endX;
        const y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * midY + t * t * endY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Suspension / foundation struts down to the 'V'
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * alpha})`;
      for (let t = 0.15; t <= prog * 0.88; t += 0.12) {
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * midX + t * t * endX;
        const y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * midY + t * t * endY;
        const vWallY = this.getVAbyssY(x);
        if (vWallY > y) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, vWallY);
          ctx.stroke();
        }
      }
    } else if (b.targetAllyType === 'square') {
      // 2. ESCALERA CUADRADA / ESCALONADA (for Square Ally)
      const steps = 8;
      const dx = (endX - startX) / steps;
      const dy = (endY - startY) / steps;
      const totalRenderSteps = Math.ceil(steps * prog);

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      for (let i = 0; i < totalRenderSteps; i++) {
        const xStepEnd = startX + (i + 1) * dx;
        const yStepStart = startY + i * dy;
        const yStepNext = startY + (i + 1) * dy;

        // Horizontal tread
        ctx.lineTo(xStepEnd, yStepStart);
        // Vertical riser
        ctx.lineTo(xStepEnd, yStepNext);
      }
      ctx.stroke();

      // Vertical pilings supporting staircase down onto the 'V'
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * alpha})`;
      for (let i = 1; i < totalRenderSteps; i += 2) {
        const px = startX + i * dx;
        const py = startY + i * dy;
        const vWallY = this.getVAbyssY(px);
        if (vWallY > py) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, vWallY);
          ctx.stroke();
        }
      }
    } else {
      // 3. ZIG-ZAG / DIENTES TRIANGULARES (for Triangle Ally)
      const teeth = 8;
      const toothWidth = (endX - startX) / teeth;
      const toothHeight = 16;
      const totalRenderTeeth = Math.ceil(teeth * prog);

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      for (let i = 0; i < totalRenderTeeth; i++) {
        const x0 = startX + i * toothWidth;
        const xMid = x0 + toothWidth * 0.5;
        const x1 = x0 + toothWidth;

        const baseYMid = startY + (endY - startY) * ((xMid - startX) / (endX - startX));
        const baseYEnd = startY + (endY - startY) * ((x1 - startX) / (endX - startX));

        // Peak
        ctx.lineTo(xMid, baseYMid - toothHeight);
        // Valley
        ctx.lineTo(x1, baseYEnd);
      }
      ctx.stroke();

      // Truss struts down to the 'V'
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * alpha})`;
      for (let i = 0; i < totalRenderTeeth; i += 2) {
        const xMid = startX + (i + 0.5) * toothWidth;
        const baseYMid = startY + (endY - startY) * ((xMid - startX) / (endX - startX));
        const py = baseYMid - toothHeight;
        const vWallY = this.getVAbyssY(xMid);
        if (vWallY > py) {
          ctx.beginPath();
          ctx.moveTo(xMid, py);
          ctx.lineTo(xMid, vWallY);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  drawClientAvatar(ctx) {
    const ca = this.clientAvatar;
    const type = this.client ? this.client.type : 'triangle';

    ctx.save();
    ctx.translate(ca.x, ca.y);
    ctx.rotate(ca.rotation);

    ctx.strokeStyle = `rgba(255, 255, 255, ${ca.opacity})`;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * ca.opacity})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12 * ca.opacity;

    if (type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (type === 'square') {
      const s = 30;
      ctx.beginPath();
      ctx.roundRect(-s / 2, -s / 2, s, s, 3);
      ctx.fill();
      ctx.stroke();
    } else {
      // Triangle
      const r = 20;
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
    ctx.letterSpacing = '3.5px';
    ctx.fillText('FIND YOUR ALLY', cx, h * 0.91);
    ctx.restore();
  }

  // Exact Center Screen Overlay: "VALUE"
  drawCenteredOverlay(ctx, cx, cy) {
    const a = this.valueAlpha;
    ctx.save();

    const cardW = 380;
    const cardH = 100;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * a})`;
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
    ctx.fillText('VALUE', cx, cy);

    ctx.restore();
  }

  // Grand Finale: 100% English ("A C V", "AGNOSTIC CONSULTING VALUE", "PLAY AGAIN")
  drawGrandFinale(ctx, w, h) {
    const cx = w / 2;
    const cy = h * 0.42;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. "A  C  V"
    ctx.font = '700 68px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 24;

    const spacing = Math.min(w * 0.20, 110);
    ctx.fillText('A', cx - spacing, cy);
    ctx.fillText('C', cx, cy);
    ctx.fillText('V', cx + spacing, cy);

    ctx.font = '300 32px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('·', cx - spacing / 2, cy);
    ctx.fillText('·', cx + spacing / 2, cy);

    // 2. Identity: "AGNOSTIC CONSULTING VALUE" (Exclusively in English)
    ctx.font = '600 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.letterSpacing = '4px';
    ctx.fillText('AGNOSTIC CONSULTING VALUE', cx, cy + 85);

    // 3. Button "PLAY AGAIN"
    const btnY = cy + 180;
    const btnW = 180;
    const btnH = 42;
    this.playAgainBtnBounds = { x: cx, y: btnY, w: btnW, h: btnH };

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, 999);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '2px';
    ctx.fillText('↺ PLAY AGAIN', cx, btnY);

    ctx.restore();
  }

  restartExperience() {
    if (window.gameManager) {
      window.gameManager.resetGame();
    }
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
