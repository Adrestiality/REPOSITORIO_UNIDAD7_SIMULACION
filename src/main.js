import './styles.css';

console.log('App ready');

const app = document.querySelector('#app');
if (app) {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#050607';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (ctx) {
      ctx.fillStyle = '#050607';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  });

  app.appendChild(canvas);
}
