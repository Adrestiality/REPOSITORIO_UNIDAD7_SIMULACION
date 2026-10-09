/**
 * physicsV.js - Physical Network Articulation & Catenary Tethers for Level V (Value)
 *
 * Implements:
 * - Letter V funnel geometry and vertex conduit.
 * - Floating Diagnostic Core at top of V with anti-direct-execution barrier.
 * - Dynamic interactive physical tethers / springs from vertex to Ally Nodes.
 * - Core release, pulse surge transmission, and constellation resonance.
 */

export class PhysicsV {
  constructor(config = {}) {
    this.width = config.width || 800;
    this.height = config.height || 600;

    // 1. Letter V Funnel Geometry
    this.topLeft = { x: this.width * 0.32, y: this.height * 0.16 };
    this.topRight = { x: this.width * 0.68, y: this.height * 0.16 };
    this.vertex = { x: this.width * 0.50, y: this.height * 0.52 };

    // 2. Floating Diagnostic Core
    this.coreBasePos = { x: this.width * 0.50, y: this.height * 0.28 };
    this.core = {
      x: this.coreBasePos.x,
      y: this.coreBasePos.y,
      vx: 0,
      vy: 0,
      radius: 22,
      isDragging: false,
      state: 'idle', // 'idle' | 'blocked' | 'flowing' | 'discharged'
      glow: 1.0,
      hoverPhase: 0
    };

    // 3. Network of Ally Nodes (Expert Partners)
    this.nodes = [];
    this.initAllyNodes();

    // 4. Physical Connections (Tethers from Vertex to Nodes)
    this.tethers = []; // Array of node indices connected
    this.activeDragTether = null; // { startX, startY, currentX, currentY }

    // 5. Energy Transmission Pulses
    this.pulses = [];
    this.sparks = [];

    // 6. Barrier & Direct Execution State
    this.vertexVibration = 0;
    this.barrierFlash = 0;

    // 7. Victory & Resonance State
    this.allConnected = false;
    this.isCompleted = false;
    this.resonancePhase = 0;
    this.grandFinaleTimer = 0;

    // Sound and Event Callbacks
    this.onTetherConnect = null;
    this.onDirectBlock = null;
    this.onCoreFlow = null;
    this.onNodeIgnite = null;
    this.onFinaleStart = null;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;

    this.topLeft = { x: w * 0.32, y: h * 0.16 };
    this.topRight = { x: w * 0.68, y: h * 0.16 };
    this.vertex = { x: w * 0.50, y: h * 0.52 };
    this.coreBasePos = { x: w * 0.50, y: h * 0.28 };

    if (this.core.state === 'idle') {
      this.core.x = this.coreBasePos.x;
      this.core.y = this.coreBasePos.y;
    }

    this.initAllyNodes();
  }

  initAllyNodes() {
    const w = this.width;
    const h = this.height;

    // 4 strategic expert ally positions arranged in an arc below the V vertex
    const positions = [
      { id: 0, x: w * 0.26, y: h * 0.72, role: 'Software & AI' },
      { id: 1, x: w * 0.42, y: h * 0.84, role: 'Cloud Architecture' },
      { id: 2, x: w * 0.58, y: h * 0.84, role: 'Data Analytics' },
      { id: 3, x: w * 0.74, y: h * 0.72, role: 'Cybersecurity' }
    ];

    // Maintain existing connection status if already connected
    const existing = new Set(this.tethers);

    this.nodes = positions.map(pos => ({
      ...pos,
      radius: 18,
      connected: existing.has(pos.id),
      ignition: existing.has(pos.id) ? 1.0 : 0.0,
      hoverOffset: Math.random() * Math.PI * 2
    }));
  }

  // Pointer & Drag Handling
  startDrag(mouseX, mouseY) {
    // 1. Check if user clicks/drags the Diagnostic Core directly
    const dxCore = mouseX - this.core.x;
    const dyCore = mouseY - this.core.y;
    if (Math.hypot(dxCore, dyCore) <= this.core.radius + 10) {
      if (this.core.state === 'idle') {
        this.core.isDragging = true;
        return 'core';
      }
    }

    // 2. Check if user starts dragging from the V Vertex to create a tether
    const dxVertex = mouseX - this.vertex.x;
    const dyVertex = mouseY - this.vertex.y;
    if (Math.hypot(dxVertex, dyVertex) <= 32) {
      this.activeDragTether = {
        startX: this.vertex.x,
        startY: this.vertex.y,
        currentX: mouseX,
        currentY: mouseY
      };
      return 'tether_vertex';
    }

    // 3. Check if user drags from an unconnected Ally Node towards the vertex
    for (let node of this.nodes) {
      if (!node.connected) {
        const dxNode = mouseX - node.x;
        const dyNode = mouseY - node.y;
        if (Math.hypot(dxNode, dyNode) <= node.radius + 10) {
          this.activeDragTether = {
            startX: node.x,
            startY: node.y,
            currentX: mouseX,
            currentY: mouseY,
            fromNodeId: node.id
          };
          return 'tether_node';
        }
      }
    }

    return null;
  }

  updateDrag(mouseX, mouseY) {
    // Handling Direct Core Drag (Anti-Direct Execution)
    if (this.core.isDragging) {
      // User can drag core, but if they pull it towards vertex before allies are connected, it resists
      const targetY = mouseY;
      const targetX = mouseX;

      if (!this.allConnected && targetY > this.vertex.y - 30) {
        // Direct execution barrier triggered!
        this.vertexVibration = 1.0;
        this.barrierFlash = 1.0;
        this.core.isDragging = false;
        this.core.state = 'blocked';

        // Recoil upward
        this.core.vy = -6.5;
        this.core.vx = (Math.random() - 0.5) * 4;

        if (this.onDirectBlock) this.onDirectBlock();
        return;
      }

      // Constrain within V funnel walls
      const leftWallX =
        this.topLeft.x +
        ((targetY - this.topLeft.y) / (this.vertex.y - this.topLeft.y)) *
          (this.vertex.x - this.topLeft.x);
      const rightWallX =
        this.topRight.x +
        ((targetY - this.topRight.y) / (this.vertex.y - this.topRight.y)) *
          (this.vertex.x - this.topRight.x);

      this.core.x = Math.max(leftWallX + 18, Math.min(rightWallX - 18, targetX));
      this.core.y = Math.max(this.topLeft.y + 10, Math.min(this.vertex.y - 15, targetY));
      return;
    }

    // Handling Tether Dragging
    if (this.activeDragTether) {
      this.activeDragTether.currentX = mouseX;
      this.activeDragTether.currentY = mouseY;
    }
  }

  endDrag() {
    if (this.core.isDragging) {
      this.core.isDragging = false;
    }

    // Evaluate Tether Connection on release
    if (this.activeDragTether) {
      const endX = this.activeDragTether.currentX;
      const endY = this.activeDragTether.currentY;

      if (this.activeDragTether.fromNodeId !== undefined) {
        // Dragged from node to vertex
        const distToVertex = Math.hypot(endX - this.vertex.x, endY - this.vertex.y);
        if (distToVertex <= 45) {
          this.connectNode(this.activeDragTether.fromNodeId);
        }
      } else {
        // Dragged from vertex to a node
        for (let node of this.nodes) {
          if (!node.connected) {
            const distToNode = Math.hypot(endX - node.x, endY - node.y);
            if (distToNode <= node.radius + 25) {
              this.connectNode(node.id);
              break;
            }
          }
        }
      }

      this.activeDragTether = null;
    }
  }

  connectNode(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node && !node.connected) {
      node.connected = true;
      this.tethers.push(nodeId);

      // Spawn tether connection sparks
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * 3.5;
        this.sparks.push({
          x: node.x,
          y: node.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.5
        });
      }

      if (this.onTetherConnect) {
        this.onTetherConnect(node.id, this.tethers.length, this.nodes.length);
      }

      // Check if all ally nodes are now tethered
      if (this.tethers.length === this.nodes.length) {
        this.allConnected = true;
        this.triggerCoreDischarge();
      }
    }
  }

  triggerCoreDischarge() {
    this.core.state = 'flowing';
    this.core.vx = 0;
    this.core.vy = 4.0;
    if (this.onCoreFlow) this.onCoreFlow();
  }

  // Simulation Update Loop
  update(dt) {
    // 1. Hovering & Spring Physics for Diagnostic Core
    this.core.hoverPhase += dt * 3.0;

    if (this.core.state === 'idle' && !this.core.isDragging) {
      // Natural floating spring back to base position
      const springK = 0.08;
      const damping = 0.85;
      const hoverY = this.coreBasePos.y + Math.sin(this.core.hoverPhase) * 6;

      const fx = (this.coreBasePos.x - this.core.x) * springK;
      const fy = (hoverY - this.core.y) * springK;

      this.core.vx = (this.core.vx + fx) * damping;
      this.core.vy = (this.core.vy + fy) * damping;

      this.core.x += this.core.vx;
      this.core.y += this.core.vy;
    } else if (this.core.state === 'blocked') {
      // Core recoiling from direct barrier hit
      this.core.vy += 9.8 * dt; // gravity back to center
      this.core.x += this.core.vx;
      this.core.y += this.core.vy;

      if (this.core.y >= this.coreBasePos.y) {
        this.core.state = 'idle';
        this.core.vx = 0;
        this.core.vy = 0;
      }
    } else if (this.core.state === 'flowing') {
      // Core accelerating down into the vertex conduit
      this.core.vy += 8.0 * dt;
      this.core.y += this.core.vy;

      // When core enters the vertex: discharge energy into all tethers!
      if (this.core.y >= this.vertex.y) {
        this.core.state = 'discharged';
        this.core.y = this.vertex.y;

        // Launch high-speed energy pulses down each tether
        this.nodes.forEach(node => {
          this.pulses.push({
            startX: this.vertex.x,
            startY: this.vertex.y,
            targetX: node.x,
            targetY: node.y,
            targetNodeId: node.id,
            progress: 0,
            speed: 2.2,
            trail: []
          });
        });
      }
    }

    // 2. Vertex Vibration & Barrier Flash Decay
    if (this.vertexVibration > 0) {
      this.vertexVibration = Math.max(0, this.vertexVibration - dt * 3.0);
    }
    if (this.barrierFlash > 0) {
      this.barrierFlash = Math.max(0, this.barrierFlash - dt * 2.5);
    }

    // 3. Update Energy Pulses along Tethers
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += dt * p.speed;

      const curX = p.startX + (p.targetX - p.startX) * p.progress;
      const curY = p.startY + (p.targetY - p.startY) * p.progress;
      p.trail.unshift({ x: curX, y: curY });
      if (p.trail.length > 8) p.trail.pop();

      // Pulse reaches destination node
      if (p.progress >= 1.0) {
        const node = this.nodes.find(n => n.id === p.targetNodeId);
        if (node) {
          node.ignition = 1.0;
          if (this.onNodeIgnite) this.onNodeIgnite(node.id);

          // Node ignition sparks
          for (let s = 0; s < 14; s++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 4.0;
            this.sparks.push({
              x: node.x,
              y: node.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 0.6
            });
          }
        }
        this.pulses.splice(i, 1);
      }
    }

    // 4. Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= dt * 2.2;
      sp.x += sp.vx;
      sp.y += sp.vy;
      if (sp.life <= 0) this.sparks.splice(i, 1);
    }

    // 5. Constellation Resonance & Grand Finale Check
    const allIgnited = this.nodes.length > 0 && this.nodes.every(n => n.ignition >= 0.9);

    if (allIgnited && !this.isCompleted) {
      this.isCompleted = true;
      if (this.onFinaleStart) this.onFinaleStart();
    }

    if (this.isCompleted) {
      this.grandFinaleTimer += dt;
      this.resonancePhase += dt * 4.0;
    }

    return {
      isCompleted: this.isCompleted,
      allConnected: this.allConnected,
      connectedCount: this.tethers.length,
      totalNodes: this.nodes.length,
      vertexVibration: this.vertexVibration,
      barrierFlash: this.barrierFlash,
      coreState: this.core.state,
      grandFinaleTimer: this.grandFinaleTimer,
      resonancePhase: this.resonancePhase
    };
  }

  reset() {
    this.core.state = 'idle';
    this.core.x = this.coreBasePos.x;
    this.core.y = this.coreBasePos.y;
    this.core.vx = 0;
    this.core.vy = 0;
    this.core.isDragging = false;
    this.tethers = [];
    this.activeDragTether = null;
    this.pulses = [];
    this.sparks = [];
    this.vertexVibration = 0;
    this.barrierFlash = 0;
    this.allConnected = false;
    this.isCompleted = false;
    this.grandFinaleTimer = 0;
    this.resonancePhase = 0;
    this.initAllyNodes();
  }

  destroy() {
    this.pulses = [];
    this.sparks = [];
    this.nodes = [];
  }
}
