// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');

// Audio (placeholders - add actual files to an 'audio' folder)
const pickupSound = new Audio('audio/pickup.mp3');
const deliverySound = new Audio('audio/delivery.mp3');
const crashSound = new Audio('audio/crash.mp3');
const boostSound = new Audio('audio/boost.mp3');

// Player
const player = {
    x: 50,
    y: 50,
    width: 20,
    height: 20,
    speed: 4,
    color: '#FF0000',
    hasPizza: false,
    boost: 0
};

// Game objects
const pizza = { x: 0, y: 0, width: 25, height: 25, color: '#FFA500', active: false };
const target = { x: 0, y: 0, width: 30, height: 30, color: '#008000', active: false };
const obstacles = [];
const powerUps = [];

// Game state
let score = 0;
let timeLeft = 60;
let gameActive = true;
let deliveriesCompleted = 0;
let level = 1;
let obstacleSpeed = 2;

// Constants
const OBSTACLE_PROPERTIES = { width: 40, height: 20, color: '#666666' };
const POWERUP_PROPERTIES = { width: 20, height: 20, color: '#FFD700' };

// Input
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Spawning
function spawnPizza() {
    pizza.x = Math.random() * (canvas.width - pizza.width);
    pizza.y = Math.random() * (canvas.height - pizza.height);
    pizza.active = true;
}

function spawnTarget() {
    target.x = Math.random() * (canvas.width - target.width);
    target.y = Math.random() * (canvas.height - target.height);
    target.active = true;
}

function spawnObstacle() {
    obstacles.push({
        x: Math.random() < 0.5 ? -OBSTACLE_PROPERTIES.width : canvas.width,
        y: Math.random() * (canvas.height - OBSTACLE_PROPERTIES.height),
        width: OBSTACLE_PROPERTIES.width,
        height: OBSTACLE_PROPERTIES.height,
        speed: (Math.random() < 0.5 ? 1 : -1) * obstacleSpeed,
        color: OBSTACLE_PROPERTIES.color
    });
}

function spawnPowerUp() {
    powerUps.push({
        x: Math.random() * (canvas.width - POWERUP_PROPERTIES.width),
        y: Math.random() * (canvas.height - POWERUP_PROPERTIES.height),
        width: POWERUP_PROPERTIES.width,
        height: POWERUP_PROPERTIES.height,
        color: POWERUP_PROPERTIES.color,
        active: true
    });
}

// Game logic
function update() {
    if (!gameActive) return;

    let currentSpeed = player.boost > 0 ? player.speed * 2 : player.speed;
    if (keys['ArrowUp'] && player.y > 0) player.y -= currentSpeed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += currentSpeed;
    if (keys['ArrowLeft'] && player.x > 0) player.x -= currentSpeed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += currentSpeed;

    if (player.boost > 0) player.boost -= 1 / 60;

    if (pizza.active && checkCollision(player, pizza) && !player.hasPizza) {
        player.hasPizza = true;
        pizza.active = false;
        pickupSound.play();
        if (!target.active) spawnTarget();
    }

    if (target.active && checkCollision(player, target) && player.hasPizza) {
        score += 15 + level * 5;
        deliveriesCompleted++;
        player.hasPizza = false;
        target.active = false;
        timeLeft += 3;
        deliverySound.play();
        spawnPizza();
        checkLevelUp();
        scoreDisplay.textContent = `Score: ${score} | Level: ${level}`;
    }

    if (Math.random() < 0.02 + level * 0.005) spawnObstacle();
    obstacles.forEach((obs, index) => {
        obs.x += obs.speed;
        if (checkCollision(player, obs)) {
            score -= 5;
            timeLeft -= 2;
            obstacles.splice(index, 1);
            crashSound.play();
            scoreDisplay.textContent = `Score: ${score} | Level: ${level}`;
        }
        if (obs.x < -obs.width || obs.x > canvas.width) obstacles.splice(index, 1);
    });

    if (Math.random() < 0.005) spawnPowerUp();
    powerUps.forEach((pu, index) => {
        if (checkCollision(player, pu) && pu.active) {
            player.boost = 5;
            pu.active = false;
            powerUps.splice(index, 1);
            boostSound.play();
        }
    });

    timeLeft -= 1 / 60;
    if (timeLeft <= 0) {
        gameActive = false;
        alert(`Game Over! Level: ${level}, Deliveries: ${deliveriesCompleted}, Score: ${score}`);
        resetGame();
    }

    if (!pizza.active && !player.hasPizza && !target.active) spawnPizza();
}

function checkLevelUp() {
    if (deliveriesCompleted >= level * 5) {
        level++;
        obstacleSpeed += 0.5;
        timeLeft += 10;
    }
}

// Drawing
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, canvas.height/2 - 20, canvas.width, 40);

    if (pizza.active) {
        ctx.fillStyle = pizza.color;
        ctx.beginPath();
        ctx.arc(pizza.x + pizza.width/2, pizza.y + pizza.height/2, pizza.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.arc(pizza.x + pizza.width/2 - 5, pizza.y + pizza.height/2 - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = player.boost > 0 ? '#FF4500' : player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    if (player.hasPizza) {
        ctx.fillStyle = pizza.color;
        ctx.beginPath();
        ctx.arc(player.x + player.width/2, player.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    if (target.active) {
        ctx.fillStyle = target.color;
        ctx.fillRect(target.x, target.y, target.width, target.height);
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(target.x, target.y);
        ctx.lineTo(target.x + target.width/2, target.y - 15);
        ctx.lineTo(target.x + target.width, target.y);
        ctx.fill();
    }

    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(obs.x + 5, obs.y + obs.height - 5, 5, 5);
        ctx.fillRect(obs.x + obs.width - 10, obs.y + obs.height - 5, 5, 5);
    });

    powerUps.forEach(pu => {
        if (pu.active) {
            ctx.fillStyle = pu.color;
            ctx.beginPath();
            ctx.arc(pu.x + pu.width/2, pu.y + pu.height/2, pu.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}s`, 10, 30);
    ctx.fillText(`Deliveries: ${deliveriesCompleted}`, 10, 60);
    ctx.fillText(`Boost: ${Math.ceil(player.boost)}s`, 10, 90);
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function resetGame() {
    player.x = 50;
    player.y = 50;
    player.hasPizza = false;
    player.boost = 0;
    pizza.active = false;
    target.active = false;
    obstacles.length = 0;
    powerUps.length = 0;
    score = 0;
    timeLeft = 60;
    deliveriesCompleted = 0;
    level = 1;
    obstacleSpeed = 2;
    gameActive = true;
    scoreDisplay.textContent = `Score: ${score} | Level: ${level}`;
    spawnPizza();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
spawnPizza();
gameLoop();
