// Ініціалізація ігрових елементів після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('pongCanvas');
  const ctx = canvas.getContext('2d');

  // Отримання елементів інтерфейсу
  const player1ScoreEl = document.getElementById('player1-score');
  const player2ScoreEl = document.getElementById('player2-score');
  const winnerModal = document.getElementById('winnerModal');
  const winnerText = document.getElementById('winnerText');
  const restartBtn = document.getElementById('restartBtn');

  // Налаштування гри
  const MAX_SCORE = 5;
  let gameActive = true;

  // Рахунок гравців
  let player1Score = 0;
  let player2Score = 0;

  // Стан клавіатури (запобігає блокуванню клавіш при одночасному натисканні)
  const keysPressed = {};

  // Об'єкт ракетки
  class Paddle {
    constructor(x, y, width, height, color, isLeft) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = color;
      this.isLeft = isLeft;
      this.speed = 9;
    }

    draw() {
      ctx.save();
      // Переносимо систему координат в центр ракетки для обертання
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(this.isLeft ? 0.25 : -0.25);

      const headY = -22;
      const rx = 18; // Горизонтальний радіус ободу
      const ry = 25; // Вертикальний радіус ободу

      // --- 1. РУЧКА ТА ШЕЙКА РАКЕТКИ ---
      ctx.strokeStyle = '#1e3d59'; // Темно-синій олівець контуру
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Дерев'яна шейка (V-подібна вилка)
      ctx.fillStyle = '#dfb274'; // Світле дерево з картинки
      ctx.beginPath();
      ctx.moveTo(-10, headY + ry - 4);
      ctx.quadraticCurveTo(-6, headY + ry + 10, -4, headY + ry + 20);
      ctx.lineTo(4, headY + ry + 20);
      ctx.quadraticCurveTo(6, headY + ry + 10, 10, headY + ry - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Дерев'яне руків'я
      ctx.fillStyle = '#c6955a'; // Темніше дерево ручки
      ctx.beginPath();
      ctx.roundRect(-4.5, headY + ry + 18, 9, 36, 3);
      ctx.fill();
      ctx.stroke();

      // Обмотка ручки (грип) в нижній частині
      ctx.fillStyle = '#b05e27'; // Шкіряний колір обмотки
      ctx.beginPath();
      ctx.roundRect(-5.5, headY + ry + 32, 11, 20, [0, 0, 4, 4]);
      ctx.fill();
      ctx.stroke();

      // Лінії обмотки (намальований ефект)
      ctx.beginPath();
      ctx.moveTo(-5, headY + ry + 37); ctx.lineTo(5, headY + ry + 37);
      ctx.moveTo(-5, headY + ry + 42); ctx.lineTo(5, headY + ry + 42);
      ctx.moveTo(-5, headY + ry + 47); ctx.lineTo(5, headY + ry + 47);
      ctx.stroke();

      // --- 2. ОБІД ТА СТРУНИ РАКЕТКИ ---
      // Дерев'яний обід ракетки
      ctx.fillStyle = '#dfb274';
      ctx.beginPath();
      ctx.ellipse(0, headY, rx + 4.5, ry + 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Натягнуте полотно середини ракетки
      ctx.fillStyle = '#e5b842'; // Теплий колір ракетки з картинки
      ctx.beginPath();
      ctx.ellipse(0, headY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Струнна сітка (тонка олівцева текстура)
      ctx.strokeStyle = 'rgba(30, 61, 89, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Горизонтальні струни
      for (let i = -ry + 6; i < ry - 4; i += 6) {
        const xLen = rx * Math.sqrt(1 - (i * i) / (ry * ry));
        ctx.moveTo(-xLen, headY + i);
        ctx.lineTo(xLen, headY + i);
      }
      // Вертикальні струни
      for (let i = -rx + 5; i < rx - 4; i += 5) {
        const yLen = ry * Math.sqrt(1 - (i * i) / (rx * rx));
        ctx.moveTo(i, headY - yLen);
        ctx.lineTo(i, headY + yLen);
      }
      ctx.stroke();

      // Малюємо обрис внутрішнього вікна ободу
      ctx.strokeStyle = '#1e3d59';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, headY, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // --- 3. ТЕНІСНИЙ М'ЯЧИК НА РАКЕТЦІ (З КАРТИНКИ) ---
      const ballOffset = this.isLeft ? -4 : 4;
      ctx.fillStyle = '#cddc39'; // Яскравий тенісний колір
      ctx.strokeStyle = '#1e3d59';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ballOffset, headY + 2, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Шви м'ячика
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ballOffset - 5, headY + 2, 5.5, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ballOffset + 5, headY + 2, 5.5, Math.PI * 2 / 3, Math.PI * 4 / 3);
      ctx.stroke();

      ctx.restore();
    }

    move(direction) {
      if (direction === 'up') {
        this.y -= this.speed;
        if (this.y < 0) this.y = 0;
      } else if (direction === 'down') {
        this.y += this.speed;
        if (this.y + this.height > canvas.height) {
          this.y = canvas.height - this.height;
        }
      }
    }
  }

  // Об'єкт м'яча
  class Ball {
    constructor(x, y, radius, color) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.baseSpeed = 5.5;
      this.speed = this.baseSpeed;
      this.vx = 0;
      this.vy = 0;
      this.reset();
    }

    draw() {
      ctx.save();
      ctx.fillStyle = '#cddc39'; // Яскравий лимонно-зелений колір тенісного м'яча
      ctx.strokeStyle = '#1e3d59'; // Контур олівця
      ctx.lineWidth = 3;

      // Малюємо основне коло
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Малюємо шви тенісного м'яча
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;

      // Лівий шов
      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.6, this.y, this.radius * 0.75, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      // Правий шов
      ctx.beginPath();
      ctx.arc(this.x + this.radius * 0.6, this.y, this.radius * 0.75, Math.PI * 2 / 3, Math.PI * 4 / 3);
      ctx.stroke();

      ctx.restore();
    }

    reset() {
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
      this.speed = this.baseSpeed;

      // Визначаємо випадковий напрямок м'яча
      const directionX = Math.random() > 0.5 ? 1 : -1;
      // Випадковий кут запуску від -30 до +30 градусів
      const angle = (Math.random() * 60 - 30) * Math.PI / 180;

      this.vx = directionX * this.speed * Math.cos(angle);
      this.vy = this.speed * Math.sin(angle);
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Відскок від верхньої та нижньої стін
      if (this.y - this.radius < 0) {
        this.y = this.radius;
        this.vy = -this.vy;
      } else if (this.y + this.radius > canvas.height) {
        this.y = canvas.height - this.radius;
        this.vy = -this.vy;
      }
    }
  }

  // Створення ігрових об'єктів
  // Ракетка 1 (ліворуч) - блакитна (isLeft = true)
  const player1 = new Paddle(25, canvas.height / 2 - 55, 32, 110, '#38bdf8', true);
  // Ракетка 2 (праворуч) - зелена (isLeft = false)
  const player2 = new Paddle(canvas.width - 25 - 32, canvas.height / 2 - 55, 32, 110, '#34d399', false);
  // М'яч (тепер тенісний)
  const ball = new Ball(canvas.width / 2, canvas.height / 2, 12, '#ffffff');

  // Малювання центральної лінії поля (у стилі олівця з картинки)
  function drawNet() {
    ctx.strokeStyle = 'rgba(30, 61, 89, 0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 12]); // Пунктирна лінія у стилі ескізу
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // Скидаємо пунктир назад
  }

  // Обробка колізій м'яча з ракетками
  function checkCollisions() {
    // Колізія з лівою ракеткою (Player 1)
    if (ball.vx < 0 && 
        ball.x - ball.radius <= player1.x + player1.width && 
        ball.x + ball.radius >= player1.x) {
      if (ball.y >= player1.y && ball.y <= player1.y + player1.height) {
        // Вираховуємо кут відскоку залежно від місця удару по ракетці
        const relativeIntersectY = (player1.y + player1.height / 2) - ball.y;
        const normalizedIntersectY = relativeIntersectY / (player1.height / 2);
        const bounceAngle = normalizedIntersectY * (Math.PI / 3.5); // Макс. кут ~50 градусів

        // Збільшуємо швидкість з кожним ударом для динаміки
        ball.speed = Math.min(ball.speed * 1.08, 14);

        ball.vx = ball.speed * Math.cos(bounceAngle);
        ball.vy = -ball.speed * Math.sin(bounceAngle);
        
        // Зміщуємо м'яч за ракетку, щоб уникнути застрягання
        ball.x = player1.x + player1.width + ball.radius;
      }
    }

    // Колізія з правою ракеткою (Player 2)
    if (ball.vx > 0 && 
        ball.x + ball.radius >= player2.x && 
        ball.x - ball.radius <= player2.x + player2.width) {
      if (ball.y >= player2.y && ball.y <= player2.y + player2.height) {
        // Вираховуємо кут відскоку залежно від місця удару
        const relativeIntersectY = (player2.y + player2.height / 2) - ball.y;
        const normalizedIntersectY = relativeIntersectY / (player2.height / 2);
        const bounceAngle = normalizedIntersectY * (Math.PI / 3.5);

        ball.speed = Math.min(ball.speed * 1.08, 14);

        ball.vx = -ball.speed * Math.cos(bounceAngle);
        ball.vy = -ball.speed * Math.sin(bounceAngle);

        ball.x = player2.x - ball.radius;
      }
    }
  }

  // Перевірка на забитий гол та оновлення рахунку
  function checkScoring() {
    if (ball.x - ball.radius < 0) {
      // Гравець 2 забиває гол
      player2Score++;
      player2ScoreEl.textContent = player2Score;
      checkWinner();
      if (gameActive) ball.reset();
    } else if (ball.x + ball.radius > canvas.width) {
      // Гравець 1 забиває гол
      player1Score++;
      player1ScoreEl.textContent = player1Score;
      checkWinner();
      if (gameActive) ball.reset();
    }
  }

  // Перевірка переможця
  function checkWinner() {
    if (player1Score >= MAX_SCORE) {
      endGame('Гравець 1 (Лівий) переміг!', 'winner-1');
    } else if (player2Score >= MAX_SCORE) {
      endGame('Гравець 2 (Правий) переміг!', 'winner-2');
    }
  }

  // Завершення гри
  function endGame(message, winnerClass) {
    gameActive = false;
    winnerText.textContent = message;
    winnerText.className = winnerClass; // додає колір переможця
    winnerModal.classList.remove('hidden');
  }

  // Перезапуск гри
  function restartGame() {
    player1Score = 0;
    player2Score = 0;
    player1ScoreEl.textContent = '0';
    player2ScoreEl.textContent = '0';
    
    // Скидаємо позиції ракеток у центр
    player1.y = canvas.height / 2 - player1.height / 2;
    player2.y = canvas.height / 2 - player2.height / 2;
    
    ball.reset();
    winnerModal.classList.add('hidden');
    gameActive = true;
  }

  // Слухач кнопки перезапуску
  restartBtn.addEventListener('click', restartGame);

  // Слідкуємо за натисканням клавіш клавіатури
  window.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;

    // Запобігаємо прокручуванню сторінки стрілками або клавішами W/S
    if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
  });

  // Оновлення стану ракеток на основі активних клавіш
  function updatePaddles() {
    // Гравець 1 (Лівий) - W та S
    if (keysPressed['KeyW']) {
      player1.move('up');
    }
    if (keysPressed['KeyS']) {
      player1.move('down');
    }

    // Гравець 2 (Правий) - ArrowUp та ArrowDown
    if (keysPressed['ArrowUp']) {
      player2.move('up');
    }
    if (keysPressed['ArrowDown']) {
      player2.move('down');
    }
  }

  // Головний ігровий цикл
  function gameLoop() {
    // Очищення екрану
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Малювання елементів поля
    drawNet();

    if (gameActive) {
      // Оновлення позицій
      updatePaddles();
      ball.update();
      
      // Перевірка колізій та забитих голів
      checkCollisions();
      checkScoring();
    }

    // Візуалізація об'єктів
    player1.draw();
    player2.draw();
    ball.draw();

    // Запит наступного кадру
    requestAnimationFrame(gameLoop);
  }

  // Запуск ігрового циклу
  gameLoop();
});
