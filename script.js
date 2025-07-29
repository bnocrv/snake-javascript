// Snake Game 8-bit estilo Dracula
// Criado por Bruno Carvalho | GitHub: bnocrv

// Pegando o canvas e o contexto
const cvs = document.getElementById('snake');
const ctx = cvs.getContext('2d');

// Tamanho de cada quadrado (bloco do jogo)
const box = 32;

// Quantidade de linhas e colunas
const cols = 19, rows = 19;

// Cores no estilo Dracula + pixelado
const colors = {
  board: '#1e1f2a',
  border: '#44475a',
  snakeHead: '#50fa7b',
  snakeBody: '#6272a4',
  snakeBorder: '#bd93f9',
  food: '#ff79c6'
};

// Sons do jogo
const eat = new Audio('audio/eat.mp3');
const dead = new Audio('audio/dead.mp3');
const move = new Audio('audio/move.mp3');

// Pontuação e direção
let score = 0;
let direction = null;

// Cobra começa no centro
let snake = [{ x: 9 * box, y: 9 * box }];

// Gera posição da comida
let food = pickFood();

// Controle por teclado (funciona em PC)
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
  }
});

// Controle por swipe para celular (touchscreen)
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const minSwipeDistance = 30; // distância mínima para considerar swipe

// Evento quando o dedo toca a tela
document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, false);

// Evento quando o dedo sai da tela
document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, false);

// Função que detecta direção do swipe
function handleSwipe() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  // Se swipe muito curto, ignora
  if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;

  // Swipe horizontal
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0 && direction !== 'LEFT') {
      direction = 'RIGHT';
      move.play();
    } else if (deltaX < 0 && direction !== 'RIGHT') {
      direction = 'LEFT';
      move.play();
    }
  } else {
    // Swipe vertical
    if (deltaY > 0 && direction !== 'UP') {
      direction = 'DOWN';
      move.play();
    } else if (deltaY < 0 && direction !== 'DOWN') {
      direction = 'UP';
      move.play();
    }
  }
}

// Função pra gerar comida em lugar aleatório
function pickFood() {
  const x = Math.floor(Math.random() * (cols - 2) + 1) * box;
  const y = Math.floor(Math.random() * (rows - 2) + 1) * box;
  return { x, y };
}

// Reinicia o jogo
function resetGame() {
  score = 0;
  snake = [{ x: 9 * box, y: 9 * box }];
  direction = null;
  food = pickFood();
  document.getElementById('score').textContent = score;
}

// Desenha o fundo do tabuleiro e bordas
function drawBoard() {
  ctx.fillStyle = colors.board;
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  drawGrid(); // chama a função que desenha o grid

  // Paredes nas bordas
  for (let i = 0; i < cols; i++) {
    drawStone(i * box, 0);
    drawStone(i * box, (rows - 1) * box);
  }
  for (let j = 0; j < rows; j++) {
    drawStone(0, j * box);
    drawStone((cols - 1) * box, j * box);
  }
}

// Desenha um bloquinho de pedra
function drawStone(x, y) {
  ctx.fillStyle = colors.border;
  ctx.fillRect(x, y, box, box);

  ctx.fillStyle = '#6272a4';
  ctx.fillRect(x + 4, y + 4, 6, 6);
  ctx.fillRect(x + 20, y + 20, 6, 6);

  ctx.fillStyle = '#282a36';
  ctx.fillRect(x + 12, y + 8, 4, 4);
}

// Desenha o grid de fundo (linhas)
function drawGrid() {
  ctx.strokeStyle = "#2c2e3a"; // cor discreta
  ctx.lineWidth = 1;

  // Linhas verticais
  for (let x = box; x < cvs.width - box; x += box) {
    ctx.beginPath();
    ctx.moveTo(x, box);
    ctx.lineTo(x, cvs.height - box);
    ctx.stroke();
  }

  // Linhas horizontais
  for (let y = box; y < cvs.height - box; y += box) {
    ctx.beginPath();
    ctx.moveTo(box, y);
    ctx.lineTo(cvs.width - box, y);
    ctx.stroke();
  }
}

// Desenha a cobra
function drawSnake() {
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? colors.snakeHead : colors.snakeBody;
    ctx.fillRect(s.x, s.y, box, box);
    ctx.strokeStyle = colors.snakeBorder;
    ctx.strokeRect(s.x, s.y, box, box);
  });
}

// Desenha a comida (um pouco menor que o bloco)
function drawFood() {
  const padding = 6; // deixa um espaço pra parecer menor
  ctx.fillStyle = colors.food;
  ctx.fillRect(
    food.x + padding / 2,
    food.y + padding / 2,
    box - padding,
    box - padding
  );
}

// Verifica se bateu na parede ou no corpo
function collision(head) {
  const min = box;
  const max = (cols - 2) * box;
  if (head.x < min || head.x > max || head.y < min || head.y > max) return true;

  // Se bater no próprio corpo
  for (let i = 1; i < snake.length; i++)
    if (head.x === snake[i].x && head.y === snake[i].y) return true;

  return false;
}

// Atualiza o jogo
function update() {
  if (!direction) return;

  const head = { ...snake[0] };
  if (direction === 'LEFT') head.x -= box;
  if (direction === 'RIGHT') head.x += box;
  if (direction === 'UP') head.y -= box;
  if (direction === 'DOWN') head.y += box;

  if (collision(head)) {
    dead.play();
    alert('Game Over! Score: ' + score);
    resetGame();
    return;
  }

  snake.unshift(head);

  // Se comer a comida
  if (head.x === food.x && head.y === food.y) {
    score++;
    eat.play();
    food = pickFood();
  } else {
    snake.pop();
  }
}

// Função principal do jogo
function gameLoop() {
  update();
  drawBoard();
  drawSnake();
  drawFood();
  document.getElementById('score').textContent = score;
}

// Começa o jogo
resetGame();
setInterval(gameLoop, 120); // velocidade do jogo

// Impede que a tela role durante o toque
document.body.addEventListener('touchstart', function (e) {
  e.preventDefault();
}, { passive: false });

document.body.addEventListener('touchmove', function (e) {
  e.preventDefault();
}, { passive: false });
