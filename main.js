/**
 * main.js - Gestor Principal de Estados y Etapas (ACV Playable System)
 *
 * Administra el ciclo de vida de las tres etapas continuas:
 * Stage A (Agnostic), Stage C (Consulting), Stage V (Value).
 */

import { StageA } from './stage-A/stageA.js';
import { StageC } from './stage-C/stageC.js';
import { StageV } from './stage-V/stageV.js';

// Variable global donde se almacena el cliente seleccionado en la Etapa A
window.selectedClient = null;

class GameManager {
  constructor() {
    this.container = document.querySelector('#canvas-wrapper');
    this.curtain = document.querySelector('#transition-curtain');
    this.nextBtn = document.querySelector('#next-stage-btn');

    this.stages = [
      { id: 'A', name: 'A · AGNOSTIC', class: StageA },
      { id: 'C', name: 'C · CONSULTING', class: StageC },
      { id: 'V', name: 'V · VALUE', class: StageV }
    ];

    this.currentStageIndex = 0;
    this.currentStageInstance = null;
    this.isTransitioning = false;

    this.initKeyboard();
    this.initNextButton();
    this.loadStage(0);
  }

  initNextButton() {
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        if (this.isTransitioning) return;
        if (this.currentStageIndex === 2) {
          if (this.currentStageInstance && this.currentStageInstance.triggerGrandFinale) {
            this.currentStageInstance.triggerGrandFinale();
          }
          this.nextBtn.classList.remove('visible');
          return;
        }
        const nextIdx = (this.currentStageIndex + 1) % this.stages.length;
        this.switchStage(nextIdx);
      });
    }
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (this.isTransitioning) return;
      if (e.key === '1') this.switchStage(0);
      else if (e.key === '2') this.switchStage(1);
      else if (e.key === '3') this.switchStage(2);
      else if (e.key === 'r' || e.key === 'R') this.resetCurrentStage();
    });
  }

  loadStage(index) {
    this.currentStageIndex = index;
    const stageDef = this.stages[index];

    // Actualizar indicador superior
    document.querySelectorAll('.stage-pill').forEach(pill => {
      pill.classList.remove('active');
    });
    const activePill = document.querySelector(`#pill-${stageDef.id}`);
    if (activePill) activePill.classList.add('active');

    // Configurar texto del botón siguiente centrado
    if (this.nextBtn) {
      const btnText = this.nextBtn.querySelector('span:first-child');
      if (btnText) {
        if (index === 0) btnText.textContent = 'STAGE C';
        else if (index === 1) btnText.textContent = 'STAGE V';
        else if (index === 2) btnText.textContent = 'VIEW VALUE';
      }
    }

    // Instanciar etapa
    this.currentStageInstance = new stageDef.class();
    this.currentStageInstance.init(this.container, (event) => {
      this.handleStageComplete(event);
    });
  }

  switchStage(index) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (this.nextBtn) {
      this.nextBtn.classList.remove('visible');
    }

    // Cortinilla de transición
    if (this.curtain) this.curtain.classList.add('active');

    setTimeout(() => {
      if (this.currentStageInstance) {
        this.currentStageInstance.destroy();
        this.currentStageInstance = null;
      }

      this.loadStage(index);

      setTimeout(() => {
        if (this.curtain) this.curtain.classList.remove('active');
        this.isTransitioning = false;
      }, 200);
    }, 350);
  }

  handleStageComplete(event) {
    console.log(`[ACV System] Stage ${event.stage} complete. Client:`, window.selectedClient);
    const nextIdx = (this.currentStageIndex + 1) % this.stages.length;
    this.switchStage(nextIdx);
  }

  resetCurrentStage() {
    if (this.currentStageInstance && this.currentStageInstance.reset) {
      this.currentStageInstance.reset();
    }
  }

  resetGame() {
    window.selectedClient = null;
    this.switchStage(0);
  }
}

// Iniciar al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  window.gameManager = new GameManager();
});
