const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const numParticles = 350;
const particles = [];

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > canvas.width) {
      this.speedX *= -1;
    }

    if (this.y < 0 || this.y > canvas.height) {
      this.speedY *= -1;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

function createParticles() {
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
}

function drawLines() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 50) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = 'black';
        ctx.globalAlpha = 1 - dist / 50;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
}

function update() {
  particles.forEach(particle => {
    particle.update();
  });
}

function draw() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawLines();

  particles.forEach(particle => {
    particle.draw();
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

createParticles();
loop();
