const canvas = createBackgroundCanvas();
const ctx = canvas.getContext('2d');

let view = setupCanvas(canvas, ctx);
const plants = [];

const PLANT_DELAY = 3000;
const PLANT_FADE_DURATION = 10 * 60 * 1000;

let nextPlantTime = 0;

window.addEventListener('resize', handleResize, { passive: true });
requestAnimationFrame(loop);

function loop(timestamp) {
  if (!plants.some(plant => plant.state === 'drawing') && timestamp >= nextPlantTime) {
    plants.push(createPlant(timestamp));
  }

  renderScene(timestamp);
  cleanupPlants(timestamp);

  requestAnimationFrame(loop);
}

function createPlant(startTime) {
  const config = createRandomPlantConfig(view);
  const system = generateLSystem(config);
  const geometry = buildGeometry(system, config);
  const leaves = decorateLeaves(geometry.leaves, config, geometry.scale);

  return {
    config,
    segments: geometry.segments,
    leaves,
    scale: geometry.scale,
    startTime,
    drawDuration: randomBetween(12000, 16000),
    state: 'drawing',
    finishedAt: null
  };
}

function renderScene(timestamp) {
  paintBackground(ctx, view);

  for (const plant of plants) {
    drawPlant(ctx, plant, timestamp);
  }
}

function drawPlant(context, plant, timestamp) {
  const { segments } = plant;
  if (!segments.length) {
    return;
  }

  const elapsed = timestamp - plant.startTime;
  const progress = Math.min(1, elapsed / plant.drawDuration);

  if (plant.state === 'drawing' && progress >= 1) {
    plant.state = 'finished';
    plant.finishedAt = timestamp;
    nextPlantTime = timestamp + PLANT_DELAY;
  }

  const fadeElapsed = plant.finishedAt ? timestamp - plant.finishedAt : 0;
  const fadeProgress = clamp(fadeElapsed / PLANT_FADE_DURATION, 0, 1);
  const alpha = 1 - fadeProgress;

  if (alpha <= 0) {
    return;
  }

  context.save();
  context.globalAlpha = alpha;

  const totalSegments = segments.length;
  const target = totalSegments * easeInOut(progress);
  const fullCount = Math.floor(target);
  const partialAmount = target - fullCount;

  for (let i = 0; i < fullCount; i++) {
    drawSegment(context, segments[i]);
  }

  if (fullCount < totalSegments && partialAmount > 0) {
    drawSegment(context, segments[fullCount], partialAmount);
  }

  if (progress > 0.85 || plant.state === 'finished') {
    drawLeaves(context, plant.leaves, alpha);
  }

  context.restore();
}

function drawSegment(context, segment, fraction = 1) {
  const targetX = segment.x1 + (segment.x2 - segment.x1) * fraction;
  const targetY = segment.y1 + (segment.y2 - segment.y1) * fraction;

  context.beginPath();
  context.moveTo(segment.x1, segment.y1);
  context.lineTo(targetX, targetY);
  context.strokeStyle = segment.color;
  context.lineWidth = segment.width;
  context.stroke();
}

function drawLeaves(context, leaves, parentAlpha) {
  if (!leaves.length) {
    return;
  }

  const leafAlpha = Math.min(1, parentAlpha * 0.9);
  context.save();
  context.globalAlpha = leafAlpha;

  for (const leaf of leaves) {
    context.beginPath();
    context.ellipse(leaf.x, leaf.y, leaf.size, leaf.size * leaf.aspect, leaf.rotation, 0, Math.PI * 2);
    context.fillStyle = leaf.color;
    context.fill();
  }

  context.restore();
}

function cleanupPlants(timestamp) {
  for (let i = plants.length - 1; i >= 0; i--) {
    const plant = plants[i];
    if (plant.finishedAt && timestamp - plant.finishedAt >= PLANT_FADE_DURATION) {
      plants.splice(i, 1);
    }
  }
}

function handleResize() {
  view = setupCanvas(canvas, ctx);
  plants.length = 0;
  nextPlantTime = 0;
}

function createBackgroundCanvas() {
  const target = document.createElement('canvas');
  target.id = 'plant-background';
  target.style.position = 'fixed';
  target.style.top = '0';
  target.style.left = '0';
  target.style.width = '100vw';
  target.style.height = '100vh';
  target.style.pointerEvents = 'none';
  target.style.zIndex = '-1';
  target.style.display = 'block';
  target.style.background = 'transparent';
  document.body.prepend(target);
  return target;
}

function setupCanvas(target, context) {
  const cssWidth = window.innerWidth;
  const cssHeight = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  target.width = Math.floor(cssWidth * dpr);
  target.height = Math.floor(cssHeight * dpr);

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.scale(dpr, dpr);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  return { width: cssWidth, height: cssHeight, dpr };
}

function createRandomPlantConfig(viewport) {
  const templates = [
    {
      axiom: 'X',
      rules: { X: 'F[+X][-X]FX', F: 'FF' },
      angleRange: [18, 26],
      iterationsRange: [5, 6],
      lengthReductionRange: [0.63, 0.7]
    },
    {
      axiom: 'X',
      rules: { X: 'F-[[X]+X]+F[+FX]-X', F: 'FF' },
      angleRange: [20, 30],
      iterationsRange: [4, 5],
      lengthReductionRange: [0.62, 0.7]
    },
    {
      axiom: 'F',
      rules: { F: 'F[+F]F[-F]F' },
      angleRange: [15, 22],
      iterationsRange: [4, 5],
      lengthReductionRange: [0.64, 0.72]
    },
    {
      axiom: 'X',
      rules: { X: 'F[+X][-X]F[+X]-X', F: 'FF' },
      angleRange: [18, 24],
      iterationsRange: [5, 6],
      lengthReductionRange: [0.65, 0.73]
    }
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];
  const angleDeg = randomBetween(template.angleRange[0], template.angleRange[1]);
  const iterations = Math.round(randomBetween(template.iterationsRange[0], template.iterationsRange[1]));
  const lengthReduction = randomBetween(template.lengthReductionRange[0], template.lengthReductionRange[1]);
  const maxDepth = Math.max(iterations - 1, 1);

  const baseLength = viewport.height * randomBetween(0.18, 0.32);
  const baseWidth = randomBetween(2, 3.3);

  return {
    ...template,
    angle: (angleDeg * Math.PI) / 180,
    iterations,
    lengthReduction,
    baseLength,
    baseWidth,
    widthReduction: randomBetween(0.6, 0.72),
    minBranchWidth: 0.45,
    angleJitter: (Math.PI / 180) * randomBetween(1.5, 5.5),
    leafProbability: randomBetween(0.15, 0.35),
    maxLeaves: 220,
    leafSizeRange: [4, 9],
    hue: randomBetween(96, 138),
    hueVariance: randomBetween(2, 6),
    branchSaturation: randomBetween(32, 45),
    branchLightness: randomBetween(20, 30),
    leafSaturation: randomBetween(48, 60),
    leafLightness: randomBetween(48, 58),
    viewport
  };
}

function generateLSystem(config) {
  let current = config.axiom;

  for (let i = 0; i < config.iterations; i++) {
    let next = '';
    for (const char of current) {
      next += config.rules[char] || char;
    }
    current = next;
  }

  return current;
}

function buildGeometry(systemString, config) {
  const { width, height } = config.viewport;
  const origin = { x: width / 2, y: height * 0.95 };

  const stack = [];
  const segments = [];
  const leaves = [];

  let x = origin.x;
  let y = origin.y;
  let angle = -Math.PI / 2;
  let length = config.baseLength;
  let linewidth = config.baseWidth;
  let depth = 0;
  let minX = x;
  let maxX = x;
  let minY = y;
  let maxY = y;

  for (const char of systemString) {
    switch (char) {
      case 'F':
      case 'G': {
        const newX = x + Math.cos(angle) * length;
        const newY = y + Math.sin(angle) * length;
        const widthForSegment = Math.max(linewidth, config.minBranchWidth);
        const color = getBranchColor(depth, config);

        segments.push({
          x1: x,
          y1: y,
          x2: newX,
          y2: newY,
          width: widthForSegment,
          depth,
          color
        });

        x = newX;
        y = newY;

        minX = Math.min(minX, x, newX);
        maxX = Math.max(maxX, x, newX);
        minY = Math.min(minY, y, newY);
        maxY = Math.max(maxY, y, newY);

        if (
          linewidth <= config.minBranchWidth + 0.8 &&
          leaves.length < config.maxLeaves &&
          Math.random() < config.leafProbability
        ) {
          leaves.push({ x, y, depth });
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }

        break;
      }
      case '+':
        angle += config.angle + (Math.random() - 0.5) * config.angleJitter;
        break;
      case '-':
        angle -= config.angle + (Math.random() - 0.5) * config.angleJitter;
        break;
      case '[':
        stack.push({ x, y, angle, length, linewidth, depth });
        length *= config.lengthReduction;
        linewidth = Math.max(linewidth * config.widthReduction, config.minBranchWidth);
        depth += 1;
        break;
      case ']': {
        const state = stack.pop();
        if (state) {
          ({ x, y, angle, length, linewidth, depth } = state);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
        break;
      }
      default:
        break;
    }
  }

  return normalizeGeometry(segments, leaves, { minX, maxX, minY, maxY }, config);
}

function paintBackground(context, viewport) {
  const gradient = context.createLinearGradient(0, 0, 0, viewport.height);
  gradient.addColorStop(0, '#fdf7f1');
  gradient.addColorStop(0.45, '#f6f0e8');
  gradient.addColorStop(1, '#edf3ea');

  context.fillStyle = gradient;
  context.fillRect(0, 0, viewport.width, viewport.height);
}

function getBranchColor(depth, config) {
  const hue = (config.hue + depth * config.hueVariance) % 360;
  const lightness = Math.min(config.branchLightness + depth * 4.5, 55);
  return `hsl(${Math.round(hue)}, ${Math.round(config.branchSaturation)}%, ${Math.round(lightness)}%)`;
}

function decorateLeaves(leaves, config, geometryScale) {
  if (!leaves.length) {
    return leaves;
  }

  const scaleFactor = Math.max(0.55, Math.min(1.2, geometryScale + 0.35));

  return leaves.map(leaf => {
    const size = randomBetween(config.leafSizeRange[0], config.leafSizeRange[1]) * scaleFactor;
    const aspect = randomBetween(0.45, 0.82);
    const rotation = Math.random() * Math.PI;
    const hue = (config.hue + 32 + leaf.depth * config.hueVariance) % 360;
    const lightness = Math.min(config.leafLightness + leaf.depth * 3.5, 70);
    const color = `hsl(${Math.round(hue)}, ${Math.round(config.leafSaturation)}%, ${Math.round(lightness)}%)`;
    return { ...leaf, size, aspect, rotation, color };
  });
}

function normalizeGeometry(segments, leaves, bounds, config) {
  if (!segments.length) {
    return { segments, leaves, scale: 1 };
  }

  const { viewport, minBranchWidth } = config;
  const { minX, maxX, minY, maxY } = bounds;

  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const marginX = viewport.width * randomBetween(0.05, 0.14);
  const marginY = viewport.height * randomBetween(0.05, 0.12);

  const scaleX = (viewport.width - marginX * 2) / width;
  const scaleY = (viewport.height - marginY * 2) / height;
  const scale = Math.min(1.05, scaleX, scaleY);

  const scaledWidth = width * scale;
  const availableX = Math.max(viewport.width - scaledWidth - marginX * 2, 0);
  const offsetX = marginX + availableX * Math.random();

  const baseLift = viewport.height * randomBetween(0.0, 0.05);
  const bottom = viewport.height - (marginY + baseLift);

  const scaledSegments = segments.map(segment => ({
    x1: offsetX + (segment.x1 - minX) * scale,
    y1: bottom - (maxY - segment.y1) * scale,
    x2: offsetX + (segment.x2 - minX) * scale,
    y2: bottom - (maxY - segment.y2) * scale,
    width: Math.max(segment.width * scale, minBranchWidth * 0.45),
    depth: segment.depth,
    color: segment.color
  }));

  const scaledLeaves = leaves.map(leaf => ({
    x: offsetX + (leaf.x - minX) * scale,
    y: bottom - (maxY - leaf.y) * scale,
    depth: leaf.depth
  }));

  return { segments: scaledSegments, leaves: scaledLeaves, scale };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
