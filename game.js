// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player (bike) properties
const player = {
    x: 50,          // Starting x position
    y: 50,          // Starting y position
    width: 20,      // Bike size
    height: 20,
    speed: 3,       // Movement speed
    color: 'red'    // Bike color
};

// Delivery target (house) properties
const target = {
    x: 500,         // Randomize later
    y: 300,
    width: 30,
    height: 30,
    color: 'green'  // House color
};

// Timer
let timeLeft = 60;  // 60 seconds to deliver
let gameActive = true;

// Keyboard input handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Game loop
function update() {
    if (!gameActive) return;

    // Move player based on key presses
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;

    // Check if player reached the target
    if (checkCollision(player, target)) {
        alert('Delivery complete! You earned 5 stars!');
        resetGame();
    }

    // Update timer
    timeLeft -= 1 / 60; // Decrease by 1/60th of a second per frame (60 FPS)
    if (timeLeft <= 0) {
        alert('Time’s up! Delivery failed.');
        resetGame();
    }
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player (bike)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw target (house)
    ctx.fillStyle = target.color;
    ctx.fillRect(target.x, target.y, target.width, target.height);

    // Draw timer
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}s`, 10, 30);
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Reset game for next delivery
function resetGame() {
    player.x = 50;
    player.y = 50;
    target.x = Math.random() * (canvas.width - target.width);
    target.y = Math.random() * (canvas.height - target.height);
    timeLeft = 60;
}

// Main game loop (runs ~60 FPS)
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
