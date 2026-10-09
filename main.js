/**
 * main.js - Core Game Manager & State Controller for ACV Playable Typographic System
 * 
 * Manages modular level lifecycles, transitions, audio feedback, and UI navigation.
 */

import { LevelA } from './level-A/levelA.js';
import { LevelC } from './level-C/levelC.js';
import { LevelV } from './level-V/levelV.js';

// Minimal Web Audio Synthesizer for tactile feedback
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playSuccessChord() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Elegant harmonic chord (C Major 9 or Pentatonic harmonics: 440Hz, 554.37Hz, 659.25Hz, 880Hz)
    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), this.ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.04);
      osc.stop(this.ctx.currentTime + 1.3);
    });
  }
}

class GameManager {
  constructor() {
    this.container = document.querySelector('#canvas-wrapper');
    this.curtain = document.querySelector('#transition-curtain');
    this.completionBanner = document.querySelector('#completion-banner');
    this.conceptLetter = document.querySelector('#concept-letter');
    this.conceptTitle = document.querySelector('#concept-title');
    this.conceptDesc = document.querySelector('#concept-desc');
    
    this.synth = new SoundSynth();

    this.levelDefinitions = [
      { id: 'A', class: LevelA, name: 'A', title: 'A · AGNOSTIC', desc: 'Mentalidad abierta y flexible. Desbloquea el prisma para refractar soluciones múltiples hacia los receptores tecnológicos.' },
      { id: 'C', class: LevelC, name: 'C', title: 'C · CONSULTING', desc: 'Análisis y filtrado. Rota la apertura del lente para clasificar el caos de problemas en Transformación Digital e Innovación.' },
      { id: 'V', class: LevelV, name: 'V', title: 'V · VALUE', desc: 'Articulación de valor. Posiciona la red de aliados expertos para canalizar y concentrar las demandas en el vértice de entrega.' }
    ];

    this.currentLevelIndex = 0;
    this.currentLevelInstance = null;
    this.completedLevels = new Set();
    this.isTransitioning = false;

    this.initUI();
    this.initKeyboard();
    this.loadLevel(0);
  }

  initUI() {
    // Level selector buttons
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const levelKey = btn.getAttribute('data-level');
        const idx = this.levelDefinitions.findIndex(l => l.id === levelKey);
        if (idx !== -1 && idx !== this.currentLevelIndex) {
          this.synth.playClick();
          this.switchLevel(idx);
        }
      });
    });

    // Reset button
    const resetBtn = document.querySelector('#reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.synth.playClick();
        this.resetCurrentLevel();
      });
    }

    // Audio toggle button
    const soundBtn = document.querySelector('#sound-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.synth.muted = !this.synth.muted;
        soundBtn.style.opacity = this.synth.muted ? '0.4' : '1.0';
      });
    }

    // Banner Next button
    const bannerNextBtn = document.querySelector('#banner-next-btn');
    if (bannerNextBtn) {
      bannerNextBtn.addEventListener('click', () => {
        this.synth.playClick();
        this.hideCompletionBanner();
        const nextIdx = (this.currentLevelIndex + 1) % this.levelDefinitions.length;
        this.switchLevel(nextIdx);
      });
    }
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (this.isTransitioning) return;

      if (e.key === '1') this.switchLevel(0);
      else if (e.key === '2') this.switchLevel(1);
      else if (e.key === '3') this.switchLevel(2);
      else if (e.key === 'r' || e.key === 'R') this.resetCurrentLevel();
      else if (e.key === ' ') {
        // Space acts as primary impulse or action
        if (this.completionBanner && this.completionBanner.classList.contains('visible')) {
          const nextIdx = (this.currentLevelIndex + 1) % this.levelDefinitions.length;
          this.hideCompletionBanner();
          this.switchLevel(nextIdx);
        }
      }
    });
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    const def = this.levelDefinitions[index];

    // Update Concept HUD Card
    if (this.conceptLetter) this.conceptLetter.textContent = def.name;
    if (this.conceptTitle) this.conceptTitle.textContent = def.title;
    if (this.conceptDesc) this.conceptDesc.textContent = def.desc;

    // Update Nav Bar Active State
    document.querySelectorAll('.level-btn').forEach(btn => {
      const key = btn.getAttribute('data-level');
      btn.classList.toggle('active', key === def.id);
    });

    // Instantiate and initialize level
    this.currentLevelInstance = new def.class();
    this.currentLevelInstance.init(this.container, (event) => this.handleLevelComplete(event));
  }

  switchLevel(index) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.hideCompletionBanner();

    // Trigger curtain fade-out
    if (this.curtain) this.curtain.classList.add('active');

    setTimeout(() => {
      // Destroy old level
      if (this.currentLevelInstance) {
        this.currentLevelInstance.destroy();
        this.currentLevelInstance = null;
      }

      // Load new level
      this.loadLevel(index);

      // Fade curtain back in
      setTimeout(() => {
        if (this.curtain) this.curtain.classList.remove('active');
        this.isTransitioning = false;
      }, 200);
    }, 350);
  }

  resetCurrentLevel() {
    if (this.currentLevelInstance && this.currentLevelInstance.reset) {
      this.currentLevelInstance.reset();
    }
  }

  handleLevelComplete(data) {
    this.completedLevels.add(data.level);
    this.synth.playSuccessChord();

    // Mark check dot in UI
    const navBtn = document.querySelector(`.level-btn[data-level="${data.level}"]`);
    if (navBtn) navBtn.classList.add('completed');

    // Show completion banner for intermediate levels A and C
    if (data.level !== 'V') {
      this.showCompletionBanner(data.level, data.title);
    }
  }

  showCompletionBanner(letter, title) {
    if (!this.completionBanner) return;
    const letterEl = this.completionBanner.querySelector('.completion-letter');
    const titleEl = this.completionBanner.querySelector('.completion-title');
    if (letterEl) letterEl.textContent = letter;
    if (titleEl) titleEl.textContent = `${title} COMPLETADO`;
    this.completionBanner.classList.add('visible');
  }

  hideCompletionBanner() {
    if (this.completionBanner) {
      this.completionBanner.classList.remove('visible');
    }
  }
}

// Start Game Manager on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameManager();
});
