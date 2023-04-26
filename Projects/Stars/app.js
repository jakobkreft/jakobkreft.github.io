function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}



class Star {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
const width = canvas.width;
const height = canvas.height;
const numStars = width * height / 100;
const stars = [];
const speed = numStars / 70000;

function initStars() {
  for (let i = 0; i < numStars; i++) {
    stars.push(new Star(Math.random() * width, Math.random() * height, Math.random() * width));
  }
}

function drawStar(star) {
  const x = (star.x - width / 2) * (width / star.z);
  const y = (star.y - height / 2) * (width / star.z);
  const r = 1 - star.z / width;

  ctx.fillStyle = 'rgba(255, 255, 255, ' + r + ')';
  ctx.beginPath();
  ctx.arc(x + width / 2, y + height / 2, r * 2, 0, 2 * Math.PI);
  ctx.fill();
}

function draw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < numStars; i++) {
    drawStar(stars[i]);
    stars[i].z -= speed;

    if (stars[i].z <= 0) {
      stars[i].x = Math.random() * width;
      stars[i].y = Math.random() * height;
      stars[i].z = width;
    }
  }
}

function animate() {
  draw();
  requestAnimationFrame(animate);
}

initStars();
animate();