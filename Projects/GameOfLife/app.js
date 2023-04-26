const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const cellSize = 5;
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);

let grid = createGrid();

function createGrid() {
  return new Array(cols).fill(null)
    .map(() => new Array(rows).fill(null)
      .map(() => Math.floor(Math.random() * 2)));
}

function draw() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const cell = grid[x][y];

      ctx.fillStyle = cell ? 'black' : 'white';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    }
  }
}

function update() {
  const newGrid = createGrid();

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const cell = grid[x][y];
      let neighbors = 0;

      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          if (i === 0 && j === 0) continue;
          const x1 = (x + i + cols) % cols;
          const y1 = (y + j + rows) % rows;
          neighbors += grid[x1][y1];
        }
      }

      if (cell && (neighbors === 2 || neighbors === 3)) {
        newGrid[x][y] = 1;
      } else if (!cell && neighbors === 3) {
        newGrid[x][y] = 1;
      } else {
        newGrid[x][y] = 0;
      }
    }
  }

  grid = newGrid;
}

function loop() {
  draw();
  update();
  setTimeout(loop, 100);
}

loop();
