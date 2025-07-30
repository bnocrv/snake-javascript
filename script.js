// Referências
const cvs = document.getElementById('snake');
const ctx = cvs.getContext('2d');
const scoreEl = document.getElementById('score');
const tituloEl = document.getElementById('titulo');

const box = 32;
const cols = 19, rows = 19;

const colors = {
  board: '#1e1f2a',
  border: '#44475a',
  snakeHead: '#ff69ebff',
  snakeBody: '#cd4bd179',
  snakeBorder: '#bd93f9',
  food: '#ffffffc5'
};

const eat = new Audio('audio/eat.mp3');
const dead = new Audio('audio/dead.mp3');
const move = new Audio('audio/move.mp3');

let score = 0;
let direction = null;
let snake = [{ x: 9 * box, y: 9 * box }];
let food = pickFood();

let highScore = 0;
let highScoreName = '_______';

// Firestore referência para doc único de recorde global
const highScoreDocRef = db.collection("scores").doc("globalHighScore");

// Carrega campeão salvo
async function loadChampion() {
  try {
    const doc = await highScoreDocRef.get();
    if (doc.exists) {
      const data = doc.data();
      highScore = data.score;
      highScoreName = data.name;
      tituloEl.innerHTML = `Campeão: ${highScoreName}<br>com ${highScore} pontos`;
    }
  } catch (e) {
    console.error("Erro ao carregar campeão:", e);
  }
}

// Atualiza recorde se pontuação for maior
async function tryUpdateChampion(finalScore) {
  if (finalScore > highScore) {
  let name = prompt("🏆 Novo recorde! Digite seu nome (máx. 20 caracteres):");
if (!name) return;
name = name.trim().slice(0, 20); // remove espaços e limita a 20 caracteres


    try {
      await highScoreDocRef.set({
        name: name.trim(),
        score: finalScore
      });
      highScore = finalScore;
      highScoreName = name.trim();
      tituloEl.innerHTML = `Campeão: ${highScoreName}<br>com ${highScore} pontos`;
      alert("🎉 Você é o novo campeão!");
    } catch (e) {
      console.error("Erro ao atualizar recorde:", e);
    }
  }
}

function pickFood() {
  let newFood;
  do {
    const x = Math.floor(Math.random() * (cols - 2) + 1) * box;
    const y = Math.floor(Math.random() * (rows - 2) + 1) * box;
    newFood = { x, y };
  } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
  return newFood;
}

function resetGame() {
  score = 0;
  snake = [{ x: 9 * box, y: 9 * box }];
  direction = null;
  food = pickFood();
  scoreEl.textContent = score;
}

function collision(head) {
  const min = box;
  const max = (cols - 2) * box;
  if (head.x < min || head.x > max || head.y < min || head.y > max) return true;
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) return true;
  }
  return false;
}

function update() {
  if (!direction) return;

  const head = { ...snake[0] };
  if (direction === 'LEFT') head.x -= box;
  if (direction === 'RIGHT') head.x += box;
  if (direction === 'UP') head.y -= box;
  if (direction === 'DOWN') head.y += box;

  if (collision(head)) {
    dead.play();
    tryUpdateChampion(score);
    resetGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    eat.play();
    food = pickFood();
  } else {
    snake.pop();
  }
}

function drawBoard() {
  ctx.fillStyle = colors.board;
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  drawGrid();

  for (let i = 0; i < cols; i++) {
    drawStone(i * box, 0);
    drawStone(i * box, (rows - 1) * box);
  }
  for (let j = 0; j < rows; j++) {
    drawStone(0, j * box);
    drawStone((cols - 1) * box, j * box);
  }
}

function drawStone(x, y) {
  ctx.fillStyle = colors.border;
  ctx.fillRect(x, y, box, box);

  ctx.fillStyle = '#6272a4';
  ctx.fillRect(x + 4, y + 4, 6, 6);
  ctx.fillRect(x + 20, y + 20, 6, 6);

  ctx.fillStyle = '#282a36';
  ctx.fillRect(x + 12, y + 8, 4, 4);
}

function drawGrid() {
  ctx.strokeStyle = "#2c2e3a";
  ctx.lineWidth = 1;

  for (let x = box; x < cvs.width - box; x += box) {
    ctx.beginPath();
    ctx.moveTo(x, box);
    ctx.lineTo(x, cvs.height - box);
    ctx.stroke();
  }

  for (let y = box; y < cvs.height - box; y += box) {
    ctx.beginPath();
    ctx.moveTo(box, y);
    ctx.lineTo(cvs.width - box, y);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? colors.snakeHead : colors.snakeBody;
    ctx.fillRect(s.x, s.y, box, box);
    ctx.strokeStyle = colors.snakeBorder;
    ctx.strokeRect(s.x, s.y, box, box);
  });
}

function drawFood() {
  const padding = 6;
  ctx.fillStyle = colors.food;
  ctx.fillRect(
    food.x + padding / 2,
    food.y + padding / 2,
    box - padding,
    box - padding
  );
}

// Previne rolagem com setas
document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  const map = {
    a: 'LEFT', arrowleft: 'LEFT',
    d: 'RIGHT', arrowright: 'RIGHT',
    w: 'UP', arrowup: 'UP',
    s: 'DOWN', arrowdown: 'DOWN'
  };
  const opposite = { LEFT: 'RIGHT', RIGHT: 'LEFT', UP: 'DOWN', DOWN: 'UP' };
  const nd = map[key];
  if (nd && nd !== opposite[direction]) {
    direction = nd;
    move.play();
    e.preventDefault(); // impede scroll
  }
}, false);

// Previne rolagem com swipe no canvas
cvs.addEventListener('touchmove', e => {
  e.preventDefault();
}, { passive: false });

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const minSwipeDistance = 30;

document.addEventListener('touchstart', e => {
  e.preventDefault(); // impõe bloqueio da rolagem
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

document.addEventListener('touchend', e => {
  e.preventDefault(); // impõe bloqueio da rolagem
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, { passive: false });


function handleSwipe() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0 && direction !== 'LEFT') {
      direction = 'RIGHT';
      move.play();
    } else if (deltaX < 0 && direction !== 'RIGHT') {
      direction = 'LEFT';
      move.play();
    }
  } else {
    if (deltaY > 0 && direction !== 'UP') {
      direction = 'DOWN';
      move.play();
    } else if (deltaY < 0 && direction !== 'DOWN') {
      direction = 'UP';
      move.play();
    }
  }
}

function gameLoop() {
  update();
  drawBoard();
  drawSnake();
  drawFood();
  scoreEl.textContent = score;
}

loadChampion();
resetGame();
setInterval(gameLoop, 120);
