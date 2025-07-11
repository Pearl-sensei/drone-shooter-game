// DOM elements
const startScreen = document.getElementById("startScreen");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const randomDrone = document.getElementById("randomDrone");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const startButton = document.getElementById("startButton");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");
const muteButton = document.getElementById("muteButton");
let isMuted = false;

// Sounds
const backgroundMusic = new Audio("assets/sounds/theme.wav");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const bulletSound = new Audio("assets/sounds/bullet.wav");
bulletSound.volume = 0.4;

const gameOverSound = new Audio("assets/sounds/gameOver.wav");
gameOverSound.volume = 0.6;

// Game variables
const colors = ["pink", "green", "orange", "purple"];
let playerColor;
let playerSprite = new Image();
let background = new Image();
let spawnLoop;
let score = 0;
let highScore = localStorage.getItem("droneHighScore") || 0;
let droneSpeed = 1;
let drones = [];
let bullets = [];
let keys = {};
let lives = 3;
let gameOver = false;
let isPaused = false;

// Show high score
highScoreDisplay.textContent = highScore;

// Load drone images
const droneImages = {};
for (let color of colors) {
  droneImages[color] = {
    normal: new Image(),
    broken: new Image()
  };
  droneImages[color].normal.src = `assets/drones/${color}.png`;
  droneImages[color].broken.src = `assets/drones/${color}_broken.png`;
}

// Show random drone on start screen
const randomColor = colors[Math.floor(Math.random() * colors.length)];
randomDrone.src = `assets/drones/${randomColor}.png`;

// Start game
startButton.addEventListener("click", () => {
  startScreen.style.display = "none";
  canvas.style.display = "block";
  backgroundMusic.play();
  initGame();
});

// Restart game
restartButton.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  canvas.style.display = "block";
  gameOver = false;
  lives = 3;
  backgroundMusic.play();
  initGame();
});

// Try to play music on load (some browsers may block)
window.addEventListener("DOMContentLoaded", () => {
  backgroundMusic.play().catch(() => {
    // Music will retry on button click
  });
});

// Initialize game
function initGame() {
  playerColor = colors[Math.floor(Math.random() * colors.length)];
  playerSprite.src = `assets/player/${playerColor}.png`;
  background.src = "assets/backgrounds/day.png";

  score = 0;
  drones = [];
  bullets = [];
  droneSpeed = 1;

  backgroundMusic.currentTime = 0;
  spawnLoop = setInterval(spawnDrone, 1000);
  requestAnimationFrame(gameLoop);
}

// Player setup
let player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  speed: 5
};

// Input controls
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "x") {
    bullets.push({ x: player.x, y: player.y });
    bulletSound.currentTime = 0;
    bulletSound.play();
  }

  if (e.key == " "){
    isPaused = !isPaused;

    if(isPaused){
      clearInterval(spawnLoop);
    }else{
      spawnLoop = setInterval(spawnDrone, 1000);
      requestAnimationFrame(gameLoop);
    }
  }
});
document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Spawn drones
function spawnDrone() {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = Math.random() * (canvas.width - 60) + 30;
  drones.push({ x, y: -60, color, state: "normal" });
}

// Update game state
function update() {
  // Player movement
  if (keys["arrowleft"] && player.x > 0) player.x -= player.speed;
  if (keys["arrowright"] && player.x < canvas.width) player.x += player.speed;
  if (keys["arrowup"] && player.y > 0) player.y -= player.speed;
  if (keys["arrowdown"] && player.y < canvas.height - 40) player.y += player.speed;

  // Move bullets
  bullets = bullets.map(b => ({ ...b, y: b.y - 6 }));

  // Move drones
  for (let d of drones) d.y += droneSpeed;

  // Bullet collision with drones
 for (let i = bullets.length - 1; i >= 0; i--) {
  const b = bullets[i];
  let hit = false;

  for (let j = 0; j < drones.length; j++) {
    const d = drones[j];

    if (
      d.state === "normal" &&
      Math.abs(b.x - d.x) < 30 &&
      Math.abs(b.y - d.y) < 30
    ) {
      d.state = "broken";

      if (d.color === playerColor) {
        score -= 2;
      } else {
        score += 2;
      }

      setTimeout(() => drones.splice(j, 1), 100);
      hit = true;
      break; // Stop checking other drones
    }
  }

  if (hit) {
    bullets.splice(i, 1); // Remove bullet after hit
  }
}

  // Drones reaching bottom
  for (let i = drones.length - 1; i >= 0; i--) {
    if (drones[i].y > canvas.height + 30) {
  if (drones[i].state === "normal") {
    if (drones[i].color !== playerColor) {
      // Only lose life for enemy drones
      lives -= 1;

      if (lives <= 0) {
        endGame();
        return;
      }
    }
  }
  drones.splice(i, 1);
}
    }
  }

  // Difficulty increase
  if (score >= 200) {
    background.src = "assets/backgrounds/night.png";
    droneSpeed = 2;
  }

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("droneHighScore", highScore);
  }


// Draw game visuals
function draw() {
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  for (let d of drones) {
    const img = droneImages[d.color][d.state];
    ctx.drawImage(img, d.x - 30, d.y - 30, 60, 60);
  }

  ctx.fillStyle = "white";
  for (let b of bullets) {
    ctx.fillRect(b.x - 2, b.y - 10, 4, 10);
  }

  ctx.drawImage(playerSprite, player.x - 20, player.y - 20, 40, 40);

  ctx.font = "20px Orbitron, Arial";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("Player Color: " + playerColor.toUpperCase(), 10, 60);
  ctx.fillText("Lives: " + lives, 10, 90);

  if (isPaused){
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "48px Orbitron, Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width /2, canvas.height /2);
    ctx.textAlign = "left";
  }
}

// Game loop
function gameLoop() {
  
  if(gameOver || isPaused) return;

  update();
  if (gameOver) return;
  draw();
  requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
  gameOver = true;
  clearInterval(spawnLoop);
  backgroundMusic.play();
  gameOverSound.play();
  finalScore.textContent = score;
  gameOverScreen.style.display = "block";
}

muteButton.addEventListener("click", () => {
  isMuted = !isMuted;

  // Toggle icon
  muteButton.textContent = isMuted ? "🔇" : "🔊";

  // Mute/unmute all sounds
  backgroundMusic.muted = isMuted;
  bulletSound.muted = isMuted;
  gameOverSound.muted = isMuted;
});