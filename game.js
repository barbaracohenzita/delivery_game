const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');

// Game state
let score = 0;
let day = 1;
let gameActive = true;
let time = 0; // Game time in seconds
const shops = []; // Pizza shops
const houses = []; // Delivery destinations
const roads = []; // Road segments
const bikes = []; // Delivery bikes

// Constants
const SHOP = { width: 30, height: 30, color: '#FF6B6B' }; // Red for pizza shops
const HOUSE = { width: 20, height: 20, color: '#4ECDC4' }; // Teal for houses
const ROAD = { width: 10, color: '#666666' }; // Gray roads
const BIKE = { size: 8, speed: 2, color: '#FFD93D' }; // Yellow bikes

// Mouse interaction
let isDragging = false;
let startX, startY;
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDragging = true;
});
canvas.addEventListener('mousemove', (e) => {});
canvas.addEventListener('mouseup', (e) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        addRoad(startX, startY, endX, endY);
        isDragging = false;
    }
});

// Spawning
function spawnShop() {
    shops.push({
        x: Math.random() * (canvas.width - SHOP.width),
        y: Math.random() * (canvas.height - SHOP.height),
        width: SHOP.width,
        height: SHOP.height,
        color: SHOP.color
    });
}

function spawnHouse() {
    houses.push({
        x: Math.random() * (canvas.width - HOUSE.width),
        y: Math.random() * (canvas.height - HOUSE.height),
        width: HOUSE.width,
        height: HOUSE.height,
        color: HOUSE.color,
        demand: 1 // Delivery demand
    });
}

function spawnBike(shop) {
    bikes.push({
        x: shop.x + shop.width / 2,
        y: shop.y + shop.height / 2,
        size: BIKE.size,
        speed: BIKE.speed,
        color: BIKE.color,
        target: null,
        path: []
    });
}

// Road management
function addRoad(x1, y1, x2, y2) {
    const startObj = findNearestObject(x1, y1);
    const endObj = findNearestObject(x2, y2);
    if (startObj && endObj && startObj !== endObj) {
        roads.push({
            start: { x: startObj.x + startObj.width / 2, y: startObj.y + startObj.height / 2 },
            end: { x: endObj.x + endObj.width / 2, y: endObj.y + endObj.height / 2 },
            width: ROAD.width,
            color: ROAD.color
        });
    }
}

function findNearestObject(x, y) {
    let closest = null;
    let minDist = Infinity;
    [...shops, ...houses].forEach(obj => {
        const dist = Math.hypot(x - (obj.x + obj.width / 2), y - (obj.y + obj.height / 2));
        if (dist < minDist && dist < 50) { // Max connection distance
            minDist = dist;
            closest = obj;
        }
    });
    return closest;
}

// Game logic
function update() {
    if (!gameActive) return;

    time += 1 / 60;

    // Spawn new objects periodically
    if (Math.random() < 0.005) spawnShop();
    if (Math.random() < 0.01) spawnHouse();

    // Spawn bikes from shops
    shops.forEach(shop => {
        if (Math.random() < 0.02 && bikes.length < 20) spawnBike(shop);
    });

    // Update bikes
    bikes.forEach((bike, index) => {
        if (!bike.target) {
            bike.target = houses.find(h => h.demand > 0);
            if (bike.target) {
                bike.path = findPath(bike, bike.target);
                bike.target.demand--;
            }
        }
        if (bike.path.length > 0) {
            const next = bike.path[0];
            const dx = next.x - bike.x;
            const dy = next.y - bike.y;
            const dist = Math.hypot(dx, dy);
            if (dist < bike.speed) {
                bike.x = next.x;
                bike.y = next.y;
                bike.path.shift();
            } else {
                bike.x += (dx / dist) * bike.speed;
                bike.y += (dy / dist) * bike.speed;
            }
        } else if (bike.target) {
            score += 10;
            bikes.splice(index, 1);
            scoreDisplay.textContent = `Score: ${score} | Day: ${day}`;
        }
    });

    // Day progression
    if (time > 30 * day) {
        day++;
        houses.forEach(h => h.demand += Math.floor(Math.random() * 2)); // Increase demand
    }

    // Game over condition
    if (houses.some(h => h.demand > 5)) {
        gameActive = false;
        alert(`Game Over! Day: ${day}, Score: ${score}`);
        resetGame();
    }
}

// Simple pathfinding
function findPath(bike, target) {
    const path = [];
    let current = { x: bike.x, y: bike.y };
    const targetPos = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    
    // Find nearest road segments
    roads.forEach(road => {
        if (Math.hypot(current.x - road.start.x, current.y - road.start.y) < 50) {
            path.push(road.start);
            if (Math.hypot(road.end.x - targetPos.x, road.end.y - targetPos.y) < 50) {
                path.push(road.end);
            }
        }
    });
    
    if (path.length === 0) {
        path.push(targetPos); // Direct path if no roads
    }
    return path;
}

// Drawing
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw roads
    roads.forEach(road => {
        ctx.strokeStyle = road.color;
        ctx.lineWidth = road.width;
        ctx.beginPath();
        ctx.moveTo(road.start.x, road.start.y);
        ctx.lineTo(road.end.x, road.end.y);
        ctx.stroke();
    });

    // Draw shops
    shops.forEach(shop => {
        ctx.fillStyle = shop.color;
        ctx.fillRect(shop.x, shop.y, shop.width, shop.height);
    });

    // Draw houses
    houses.forEach(house => {
        ctx.fillStyle = house.color;
        ctx.fillRect(house.x, house.y, house.width, house.height);
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(house.demand, house.x + 5, house.y + 15);
    });

    // Draw bikes
    bikes.forEach(bike => {
        ctx.fillStyle = bike.color;
        ctx.beginPath();
        ctx.arc(bike.x, bike.y, bike.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // UI
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.fillText(`Time: ${Math.floor(time)}s`, 10, 30);
}

// Reset
function resetGame() {
    score = 0;
    day = 1;
    time = 0;
    shops.length = 0;
    houses.length = 0;
    roads.length = 0;
    bikes.length = 0;
    gameActive = true;
    scoreDisplay.textContent = `Score: ${score} | Day: ${day}`;
    spawnShop();
    spawnHouse();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
spawnShop();
spawnHouse();
gameLoop();
