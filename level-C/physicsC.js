/**
 * physicsC.js - Centrifugal Analysis & Vector Sorting Engine for Level C (Consulting)
 *
 * Implements:
 * - Letter C container and dynamic arc orientation.
 * - Chaotic swarm particles: Rectilinear (Digital Transformation) vs Fluid (Innovation).
 * - Internal vector field forces modulated by C rotation.
 * - Anti-brute-force containment barrier.
 * - Left (≡) and Right (~) strategic receptor poles.
 */

export class PhysicsC {
  constructor(config = {}) {
    this.width = config.width || 800;
    this.height = config.height || 600;

    // 1. Geometry of the Letter C Container
    this.center = { x: this.width / 2, y: this.height * 0.40 };
    this.outerRadius = Math.min(this.width, this.height) * 0.26;
    this.innerRadius = this.outerRadius * 0.62;
    this.openingHalfAngle = 0.55; // ~32 degrees opening

    // 2. Interactive Rotation & Aperture
    this.angle = 0; // Current rotation angle in radians
    this.targetAngle = 0;
    this.angularVelocity = 0;
    this.isDraggingArc = false;
    this.dragStartAngle = 0;
    this.initialAngle = 0;

    // 3. Receptors below the C
    this.receptorY = this.height * 0.82;
    this.leftReceptor = {
      id: 'digital',
      name: 'Transformación Digital',
      symbol: '≡',
      x: this.width * 0.30,
      y: this.receptorY,
      width: 90,
      height: 70,
      absorbed: 0,
      target: 10,
      glow: 0
    };

    this.rightReceptor = {
      id: 'innovation',
      name: 'Innovación',
      symbol: '~',
      x: this.width * 0.70,
      y: this.receptorY,
      width: 90,
      height: 70,
      absorbed: 0,
      target: 10,
      glow: 0
    };

    // 4. Swarm Particles
    this.particles = [];
    this.totalDigital = 10;
    this.totalInnovation = 10;
    this.initSwarm();

    // 5. Sparks & Visual Absorptions
    this.sparks = [];
    this.absorptionBursts = [];

    // 6. Direct Drag Prevention (Anti-Brute Force)
    this.draggedParticle = null;
    this.barrierFlash = 0;

    // 7. Victory & Completion State
    this.isCompleted = false;
    this.victoryProgress = 0;

    // Sound Callbacks
    this.onAbsorb = null;
    this.onBarrierBlock = null;
    this.onWin = null;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.center = { x: w / 2, y: h * 0.40 };
    this.outerRadius = Math.min(w, h) * 0.26;
    this.innerRadius = this.outerRadius * 0.62;

    this.receptorY = h * 0.82;
    this.leftReceptor.x = w * 0.30;
    this.leftReceptor.y = this.receptorY;
    this.rightReceptor.x = w * 0.70;
    this.rightReceptor.y = this.receptorY;
  }

  initSwarm() {
    this.particles = [];

    // Spawn Rectilinear (Digital) Particles
    for (let i = 0; i < this.totalDigital; i++) {
      const radius = this.innerRadius + Math.random() * (this.outerRadius - this.innerRadius);
      const theta = (Math.random() - 0.5) * Math.PI * 1.3;
      this.particles.push({
        id: `dig_${i}`,
        type: 'digital', // Rectilinear
        x: this.center.x + Math.cos(theta) * radius,
        y: this.center.y + Math.sin(theta) * radius,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 5,
        stepTimer: Math.random() * 0.4,
        state: 'swarming', // 'swarming' | 'channeling' | 'absorbed'
        trail: []
      });
    }

    // Spawn Fluid (Innovation) Particles
    for (let i = 0; i < this.totalInnovation; i++) {
      const radius = this.innerRadius + Math.random() * (this.outerRadius - this.innerRadius);
      const theta = (Math.random() - 0.5) * Math.PI * 1.3;
      this.particles.push({
        id: `inn_${i}`,
        type: 'innovation', // Fluid undulating
        x: this.center.x + Math.cos(theta) * radius,
        y: this.center.y + Math.sin(theta) * radius,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 4.5,
        waveOffset: Math.random() * Math.PI * 2,
        state: 'swarming',
        trail: []
      });
    }
  }

  // Pointer & Drag Handling
  startDrag(mouseX, mouseY) {
    const dx = mouseX - this.center.x;
    const dy = mouseY - this.center.y;
    const dist = Math.hypot(dx, dy);

    // 1. Check if user tries to grab a particle directly
    for (let p of this.particles) {
      if (p.state === 'swarming') {
        const pdx = mouseX - p.x;
        const pdy = mouseY - p.y;
        if (Math.hypot(pdx, pdy) < 16) {
          this.draggedParticle = p;
          this.barrierFlash = 1.0;
          if (this.onBarrierBlock) this.onBarrierBlock();
          return 'particle_blocked';
        }
      }
    }

    // 2. Check if user interacts with C arc body
    if (dist >= this.innerRadius * 0.7 && dist <= this.outerRadius * 1.4) {
      this.isDraggingArc = true;
      this.dragStartAngle = Math.atan2(dy, dx);
      this.initialAngle = this.angle;
      return 'arc';
    }

    return null;
  }

  updateDrag(mouseX, mouseY) {
    if (this.draggedParticle) {
      // Particle cannot escape the C boundary through direct dragging
      const dx = mouseX - this.center.x;
      const dy = mouseY - this.center.y;
      const dist = Math.hypot(dx, dy);
      const clampedDist = Math.max(this.innerRadius + 5, Math.min(this.outerRadius - 5, dist));
      const angle = Math.atan2(dy, dx);

      this.draggedParticle.x = this.center.x + Math.cos(angle) * clampedDist;
      this.draggedParticle.y = this.center.y + Math.sin(angle) * clampedDist;
      this.barrierFlash = 0.8;
      return;
    }

    if (this.isDraggingArc) {
      const dx = mouseX - this.center.x;
      const dy = mouseY - this.center.y;
      const currentAngle = Math.atan2(dy, dx);
      const delta = currentAngle - this.dragStartAngle;
      this.targetAngle = this.initialAngle + delta;
    }
  }

  endDrag() {
    this.isDraggingArc = false;
    this.draggedParticle = null;
  }

  // Physics Simulation Step
  update(dt) {
    // 1. Smooth interpolation for C's orientation
    this.angle += (this.targetAngle - this.angle) * 0.18;

    // Decay barrier flash
    if (this.barrierFlash > 0) {
      this.barrierFlash = Math.max(0, this.barrierFlash - dt * 2.5);
    }

    // 2. Vector Field Forces Derived from C's Angle
    // Normalized angle relative to baseline
    const normAngle = ((this.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // Tilting Left (towards -PI/2 or 3PI/2) activates Digital Extraction field towards Left Receptor (≡)
    // Tilting Right (towards +PI/2) activates Innovation Extraction field towards Right Receptor (~)
    const sinTilt = Math.sin(this.angle);
    const cosTilt = Math.cos(this.angle);

    // Opening direction vector
    const mouthX = this.center.x + Math.cos(this.angle) * this.outerRadius;
    const mouthY = this.center.y + Math.sin(this.angle) * this.outerRadius;

    // 3. Update Swarm Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Trail recording
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.pop();

      if (p.state === 'swarming') {
        // A. Intrinsic particle motion behavior
        if (p.type === 'digital') {
          // Rectilinear step physics (stepped orthogonal pulses)
          p.stepTimer -= dt;
          if (p.stepTimer <= 0) {
            p.stepTimer = 0.15 + Math.random() * 0.2;
            const dir = Math.floor(Math.random() * 4);
            const speed = 2.4;
            if (dir === 0) { p.vx = speed; p.vy = 0; }
            else if (dir === 1) { p.vx = -speed; p.vy = 0; }
            else if (dir === 2) { p.vx = 0; p.vy = speed; }
            else { p.vx = 0; p.vy = -speed; }
          }
        } else {
          // Fluid wave physics (smooth undulating sinusoidal flow)
          p.waveOffset += dt * 4.0;
          p.vx += Math.cos(p.waveOffset) * 0.4;
          p.vy += Math.sin(p.waveOffset) * 0.4;
          p.vx *= 0.94;
          p.vy *= 0.94;
        }

        // B. Apply Centrifugal & Analytical Field Forces
        // If C is tilted counterclockwise / downwards-left: forces Digital particles to open mouth
        if (sinTilt < -0.35 && p.type === 'digital') {
          const toMouthX = mouthX - p.x;
          const toMouthY = mouthY - p.y;
          const distMouth = Math.hypot(toMouthX, toMouthY);
          p.vx += (toMouthX / distMouth) * 4.5 * dt;
          p.vy += (toMouthY / distMouth) * 4.5 * dt;

          if (distMouth < 40) {
            p.state = 'channeling';
          }
        }

        // If C is tilted clockwise / downwards-right: forces Innovation particles to open mouth
        if (sinTilt > 0.35 && p.type === 'innovation') {
          const toMouthX = mouthX - p.x;
          const toMouthY = mouthY - p.y;
          const distMouth = Math.hypot(toMouthX, toMouthY);
          p.vx += (toMouthX / distMouth) * 4.5 * dt;
          p.vy += (toMouthY / distMouth) * 4.5 * dt;

          if (distMouth < 40) {
            p.state = 'channeling';
          }
        }

        // Integrate position
        p.x += p.vx;
        p.y += p.vy;

        // C. Hard Containment Boundary inside C
        const dx = p.x - this.center.x;
        const dy = p.y - this.center.y;
        const dist = Math.hypot(dx, dy);
        const pAngle = Math.atan2(dy, dx);
        let relAngle = (pAngle - this.angle) % (Math.PI * 2);
        if (relAngle > Math.PI) relAngle -= Math.PI * 2;
        if (relAngle < -Math.PI) relAngle += Math.PI * 2;

        // Inside the solid arc wall: reflect back inward
        if (Math.abs(relAngle) > this.openingHalfAngle) {
          if (dist < this.innerRadius) {
            const push = this.innerRadius - dist;
            p.x += Math.cos(pAngle) * push;
            p.y += Math.sin(pAngle) * push;
            p.vx *= -0.5;
            p.vy *= -0.5;
          } else if (dist > this.outerRadius) {
            const push = dist - this.outerRadius;
            p.x -= Math.cos(pAngle) * push;
            p.y -= Math.sin(pAngle) * push;
            p.vx *= -0.5;
            p.vy *= -0.5;
          }
        }
      } else if (p.state === 'channeling') {
        // Particle has been analyzed and filtered! Accelerating towards corresponding target pole
        const target = p.type === 'digital' ? this.leftReceptor : this.rightReceptor;
        const toTargetX = target.x - p.x;
        const toTargetY = target.y - p.y;
        const distTarget = Math.hypot(toTargetX, toTargetY);

        const speed = 7.0;
        p.vx = (toTargetX / distTarget) * speed;
        p.vy = (toTargetY / distTarget) * speed;

        p.x += p.vx;
        p.y += p.vy;

        // Check if absorbed by receptor
        if (distTarget < 35) {
          p.state = 'absorbed';
          target.absorbed++;
          target.glow = 1.0;

          // Spawn absorption burst
          this.absorptionBursts.push({
            x: target.x,
            y: target.y,
            radius: 8,
            type: p.type,
            life: 1.0
          });

          if (this.onAbsorb) this.onAbsorb(p.type, target.absorbed);
          this.particles.splice(i, 1);
        }
      }
    }

    // 4. Update Receptors Glow Decay
    this.leftReceptor.glow = Math.max(0, this.leftReceptor.glow - dt * 1.5);
    this.rightReceptor.glow = Math.max(0, this.rightReceptor.glow - dt * 1.5);

    // 5. Update Absorption Bursts
    for (let i = this.absorptionBursts.length - 1; i >= 0; i--) {
      const b = this.absorptionBursts[i];
      b.life -= dt * 2.0;
      b.radius += dt * 35;
      if (b.life <= 0) this.absorptionBursts.splice(i, 1);
    }

    // 6. Check Victory Condition
    const totalAbsorbed = this.leftReceptor.absorbed + this.rightReceptor.absorbed;
    const totalTarget = this.leftReceptor.target + this.rightReceptor.target;

    if (totalAbsorbed >= totalTarget && !this.isCompleted) {
      this.isCompleted = true;
      if (this.onWin) this.onWin();
    }

    if (this.isCompleted) {
      this.victoryProgress = Math.min(1.0, this.victoryProgress + dt * 0.75);
    }

    return {
      isCompleted: this.isCompleted,
      victoryProgress: this.victoryProgress,
      angle: this.angle,
      digitalAbsorbed: this.leftReceptor.absorbed,
      innovationAbsorbed: this.rightReceptor.absorbed,
      totalTarget,
      totalAbsorbed,
      barrierFlash: this.barrierFlash
    };
  }

  reset() {
    this.angle = 0;
    this.targetAngle = 0;
    this.isDraggingArc = false;
    this.draggedParticle = null;
    this.barrierFlash = 0;
    this.isCompleted = false;
    this.victoryProgress = 0;
    this.leftReceptor.absorbed = 0;
    this.leftReceptor.glow = 0;
    this.rightReceptor.absorbed = 0;
    this.rightReceptor.glow = 0;
    this.absorptionBursts = [];
    this.initSwarm();
  }

  destroy() {
    this.particles = [];
    this.absorptionBursts = [];
    this.sparks = [];
  }
}
