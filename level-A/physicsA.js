/**
 * physicsA.js - Matter.js Physics Engine & Dynamic Compass Geometry for Level A (Agnostic)
 *
 * Implements:
 * - Falling Matter.js geometric bodies (Circle, Triangle, Square).
 * - Dynamic opening/closing of Letter A legs (Compass / Agnostic Fan).
 * - Rigid single-slot filter vs Adaptive Multi-Receptor base.
 * - Rejection collisions and Acceptance mechanics.
 */

import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Composite } = Matter;

export class PhysicsA {
  constructor(config = {}) {
    this.width = config.width || 800;
    this.height = config.height || 600;

    // 1. Initialize Matter.js Engine
    this.engine = Engine.create({
      gravity: { x: 0, y: 1.1, scale: 0.001 }
    });
    this.world = this.engine.world;

    // 2. Letter A Geometry Parameters
    this.apexY = this.height * 0.18;
    this.baseY = this.height * 0.78;
    this.crossbarBaseY = this.height * 0.50;
    this.maxCrossbarDragY = this.height * 0.68;

    // Openness (spread): 0 = rigid narrow, 1 = wide agnostic fan
    this.spread = 0.0;
    this.targetSpread = 0.0;
    this.isDraggingCrossbar = false;

    // 3. Falling Shapes State
    this.spawnTimer = 0;
    this.spawnInterval = 0.85; // seconds
    this.shapes = []; // active shape entities: { body, type, shapeId, state, life, size }
    this.shapeCounter = 0;
    
    // 4. Particle & Destruction Effects
    this.sparks = [];
    this.acceptedBursts = [];

    // 5. Game Progression (Target: at least 3 of each shape type accepted)
    this.acceptedCounts = {
      circle: 0,
      triangle: 0,
      square: 0
    };
    this.targetPerType = 3;
    this.totalRequired = 9;
    this.isCompleted = false;
    this.expansionProgress = 0; // 0 -> 1 on win

    // Callbacks for sound/visual triggers
    this.onReject = null;
    this.onAccept = null;
    this.onWin = null;

    // Static physics boundaries for funneling
    this.leftWallBody = null;
    this.rightWallBody = null;
    this.createFunnelWalls();
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.apexY = h * 0.18;
    this.baseY = h * 0.78;
    this.crossbarBaseY = h * 0.50;
    this.maxCrossbarDragY = h * 0.68;
    this.createFunnelWalls();
  }

  createFunnelWalls() {
    // Clean up old static walls if any
    if (this.leftWallBody) Composite.remove(this.world, this.leftWallBody);
    if (this.rightWallBody) Composite.remove(this.world, this.rightWallBody);

    // Calculate current leg angle & positions based on spread
    const centerX = this.width / 2;
    const currentBaseSpread = 80 + this.spread * (this.width * 0.38);

    const leftBaseX = centerX - currentBaseSpread;
    const rightBaseX = centerX + currentBaseSpread;

    const leftAngle = Math.atan2(this.baseY - this.apexY, leftBaseX - centerX) - Math.PI / 2;
    const rightAngle = Math.atan2(this.baseY - this.apexY, rightBaseX - centerX) - Math.PI / 2;

    const legLength = Math.hypot(leftBaseX - centerX, this.baseY - this.apexY);

    this.leftWallBody = Bodies.rectangle(
      (centerX + leftBaseX) / 2,
      (this.apexY + this.baseY) / 2,
      12,
      legLength,
      { isStatic: true, angle: leftAngle, friction: 0.05, restitution: 0.3 }
    );

    this.rightWallBody = Bodies.rectangle(
      (centerX + rightBaseX) / 2,
      (this.apexY + this.baseY) / 2,
      12,
      legLength,
      { isStatic: true, angle: rightAngle, friction: 0.05, restitution: 0.3 }
    );

    Composite.add(this.world, [this.leftWallBody, this.rightWallBody]);
  }

  updateFunnelWalls() {
    if (!this.leftWallBody || !this.rightWallBody) return;

    const centerX = this.width / 2;
    const currentBaseSpread = 80 + this.spread * (this.width * 0.38);
    const leftBaseX = centerX - currentBaseSpread;
    const rightBaseX = centerX + currentBaseSpread;

    const leftAngle = Math.atan2(this.baseY - this.apexY, leftBaseX - centerX) - Math.PI / 2;
    const rightAngle = Math.atan2(this.baseY - this.apexY, rightBaseX - centerX) - Math.PI / 2;
    const legLength = Math.hypot(leftBaseX - centerX, this.baseY - this.apexY);

    Body.setPosition(this.leftWallBody, {
      x: (centerX + leftBaseX) / 2 - 8,
      y: (this.apexY + this.baseY) / 2
    });
    Body.setAngle(this.leftWallBody, leftAngle);

    Body.setPosition(this.rightWallBody, {
      x: (centerX + rightBaseX) / 2 + 8,
      y: (this.apexY + this.baseY) / 2
    });
    Body.setAngle(this.rightWallBody, rightAngle);
  }

  // Crossbar Drag Handling
  startCrossbarDrag(y) {
    this.isDraggingCrossbar = true;
    this.updateCrossbarDrag(y);
  }

  updateCrossbarDrag(y) {
    if (!this.isDraggingCrossbar) return;
    const range = this.maxCrossbarDragY - this.crossbarBaseY;
    const clampedY = Math.max(this.crossbarBaseY, Math.min(this.maxCrossbarDragY, y));
    this.targetSpread = (clampedY - this.crossbarBaseY) / range;
  }

  endCrossbarDrag() {
    this.isDraggingCrossbar = false;
  }

  // Spawning Geometric Shapes
  spawnShape() {
    if (this.isCompleted) return;

    const types = ['circle', 'triangle', 'square'];
    // Pick the type intelligently to give player balanced variety
    const type = types[Math.floor(Math.random() * types.length)];
    const centerX = this.width / 2;
    const spawnX = centerX + (Math.random() - 0.5) * 40;
    const spawnY = this.apexY - 30;
    const size = 20;

    let body;
    if (type === 'circle') {
      body = Bodies.circle(spawnX, spawnY, size / 2, {
        restitution: 0.4,
        friction: 0.05,
        density: 0.002
      });
    } else if (type === 'square') {
      body = Bodies.rectangle(spawnX, spawnY, size, size, {
        restitution: 0.3,
        friction: 0.1,
        density: 0.002
      });
    } else {
      // Triangle (3-sided regular polygon)
      body = Bodies.polygon(spawnX, spawnY, 3, size * 0.65, {
        restitution: 0.35,
        friction: 0.08,
        density: 0.002
      });
    }

    // Give slight initial downward impulse
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 1.0,
      y: 2.0 + Math.random() * 1.5
    });

    Composite.add(this.world, body);

    this.shapes.push({
      id: ++this.shapeCounter,
      body,
      type,
      size,
      state: 'falling', // 'falling' | 'accepted' | 'rejected'
      alpha: 1.0,
      rotation: 0
    });
  }

  // Get current geometric receptors at the base
  getReceptors() {
    const centerX = this.width / 2;
    const baseSpread = 80 + this.spread * (this.width * 0.38);
    const leftBaseX = centerX - baseSpread;
    const rightBaseX = centerX + baseSpread;
    const y = this.baseY;

    if (this.spread < 0.32) {
      // RIGID MODE: Only a single rigid square slot in the center
      return [
        {
          type: 'square',
          x: centerX,
          y: y,
          width: 32,
          height: 32,
          isRigidSlot: true
        }
      ];
    } else {
      // AGNOSTIC ADAPTIVE MODE: 3 specialized receptors (Circle, Square, Triangle)
      return [
        {
          type: 'circle',
          x: leftBaseX + (centerX - leftBaseX) * 0.45,
          y: y,
          radius: 18,
          isRigidSlot: false
        },
        {
          type: 'square',
          x: centerX,
          y: y,
          width: 30,
          height: 30,
          isRigidSlot: false
        },
        {
          type: 'triangle',
          x: centerX + (rightBaseX - centerX) * 0.55,
          y: y,
          radius: 18,
          isRigidSlot: false
        }
      ];
    }
  }

  // Main Simulation Step
  update(dt) {
    // 1. Smoothly interpolate spread towards target
    if (this.isDraggingCrossbar) {
      this.spread += (this.targetSpread - this.spread) * 0.3;
    } else {
      // Slow relaxation back if released, but maintain player engagement
      this.spread += (this.targetSpread - this.spread) * 0.15;
    }
    this.updateFunnelWalls();

    // 2. Step Matter.js Physics Engine
    Engine.update(this.engine, Math.min(dt * 1000, 33));

    // 3. Spawning Shapes
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && !this.isCompleted) {
      this.spawnTimer = this.spawnInterval;
      this.spawnShape();
    }

    // 4. Evaluate Shapes with Base Receptors / Rejections
    const receptors = this.getReceptors();
    const isRigid = this.spread < 0.32;

    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const s = this.shapes[i];
      const pos = s.body.position;

      // Check if shape has reached the base gate line
      if (s.state === 'falling' && pos.y >= this.baseY - 15 && pos.y <= this.baseY + 40) {
        let matched = false;

        // Test intersection against active receptors
        for (let rec of receptors) {
          const dx = pos.x - rec.x;
          const dy = pos.y - rec.y;
          const dist = Math.hypot(dx, dy);

          if (isRigid) {
            // Rigid central slot only fits 'square'
            if (Math.abs(dx) < 22 && Math.abs(dy) < 22) {
              if (s.type === 'square') {
                matched = true;
                this.acceptShape(s, rec);
              } else {
                // Circle or Triangle blocked and rejected!
                this.rejectShape(s, pos.x, pos.y);
              }
              break;
            }
          } else {
            // Agnostic mode: check if near its matching shaped receptor
            if (rec.type === s.type && dist < 32) {
              matched = true;
              this.acceptShape(s, rec);
              break;
            }
          }
        }

        // If it crossed the base line in rigid mode and didn't match, reject it
        if (!matched && isRigid && (s.type !== 'square') && Math.abs(pos.x - this.width / 2) < 60) {
          this.rejectShape(s, pos.x, pos.y);
        }
      }

      // Cleanup out of bounds or dead shapes
      if (pos.y > this.height + 60 || s.state === 'rejected' || s.state === 'accepted') {
        Composite.remove(this.world, s.body);
        this.shapes.splice(i, 1);
      }
    }

    // 5. Update Sparks & Feedback Bursts
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= dt * 2.5;
      sp.x += sp.vx;
      sp.y += sp.vy;
      if (sp.life <= 0) this.sparks.splice(i, 1);
    }

    for (let i = this.acceptedBursts.length - 1; i >= 0; i--) {
      const b = this.acceptedBursts[i];
      b.life -= dt * 1.8;
      b.radius += dt * 45;
      if (b.life <= 0) this.acceptedBursts.splice(i, 1);
    }

    // 6. Check Win Condition
    const totalAccepted =
      this.acceptedCounts.circle +
      this.acceptedCounts.square +
      this.acceptedCounts.triangle;

    if (totalAccepted >= this.totalRequired && !this.isCompleted) {
      this.isCompleted = true;
      if (this.onWin) this.onWin();
    }

    if (this.isCompleted) {
      this.expansionProgress = Math.min(1.0, this.expansionProgress + dt * 0.7);
    }

    return {
      isCompleted: this.isCompleted,
      spread: this.spread,
      totalAccepted,
      totalRequired: this.totalRequired,
      acceptedCounts: { ...this.acceptedCounts },
      expansionProgress: this.expansionProgress
    };
  }

  acceptShape(shape, receptor) {
    shape.state = 'accepted';
    this.acceptedCounts[shape.type] = Math.min(
      this.targetPerType,
      this.acceptedCounts[shape.type] + 1
    );

    // Create radiant acceptance ripple
    this.acceptedBursts.push({
      x: receptor.x,
      y: receptor.y,
      radius: 10,
      maxRadius: 50,
      life: 1.0,
      type: shape.type
    });

    if (this.onAccept) {
      this.onAccept(shape.type, this.acceptedCounts[shape.type]);
    }
  }

  rejectShape(shape, x, y) {
    shape.state = 'rejected';

    // Spawn destruction/glitch sparks
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.0;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }

    if (this.onReject) {
      this.onReject(shape.type);
    }
  }

  reset() {
    this.spread = 0.0;
    this.targetSpread = 0.0;
    this.isDraggingCrossbar = false;
    this.acceptedCounts = { circle: 0, triangle: 0, square: 0 };
    this.isCompleted = false;
    this.expansionProgress = 0;
    this.sparks = [];
    this.acceptedBursts = [];

    // Remove existing shape bodies from Matter world
    this.shapes.forEach(s => Composite.remove(this.world, s.body));
    this.shapes = [];
    this.createFunnelWalls();
  }

  destroy() {
    this.shapes.forEach(s => Composite.remove(this.world, s.body));
    if (this.leftWallBody) Composite.remove(this.world, this.leftWallBody);
    if (this.rightWallBody) Composite.remove(this.world, this.rightWallBody);
    World.clear(this.world, false);
    Engine.clear(this.engine);
  }
}
