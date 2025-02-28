const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const dayDisplay = document.getElementById('day');
const roadsDisplay = document.getElementById('roads');

// Game state
let score = 0;
let day = 1;
let time = 0;
let gameActive = true;
let roadLimit = 10;
const shops = [];
const houses = [];
const roads = [];
const bikes = [];

// Constants
const SHOP = { width: 30, height: 30, color: '#FF6B6B' };
const HOUSE = { width: 20, height: 20, color: '#4ECDC4' };
const ROAD = { width: 10, color: '#666666' };
const BIKE = { size: 8, speed: 2, color: '#FFD93D' };

// Mouse interaction
let isDragging = false;
let startX, startY, previewRoad = null;
canvas.addEventListener('mousedown', (e) => {
    if (roadLimit <= 0) return;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDragging = true;
});
canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        previewRoad = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
});
canvas.addEventListener('mouseup', (e) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        addRoad(startX, startY, endX, endY);
        isDragging = false;
        previewRoad = null;
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
        demand: 0,
        timer: 0
    });
}

function spawnBike(shop) {
    const bike = {
        x: shop.x + shop.width / 2,
        y: shop.y + shop.height / 2,
        size: BIKE.size,
        speed: BIKE.speed,
        color: BIKE.color,
        target: null,
        path: [],
        stuck: 0
    };
    bikes.push(bike);
    assignTarget(bike);
}

// Road management
function addRoad(x1, y1, x2, y2) {
    const startObj = findNearestObject(x1, y1);
    const endObj = findNearestObject(x2, y2);
    if (startObj && endObj && startObj !== endObj && roadLimit > 0) {
        roads.push({
            start: { x: startObj.x + startObj.width / 2, y: startObj.y + startObj.height / 2 },
            end: { x: endObj.x + endObj.width / 2, y: endObj.y + endObj.height / 2 },
            width: ROAD.width,
            color: ROAD.color,
            traffic: 0
        });
        roadLimit--;
        roadsDisplay.textContent = `Roads: ${roadLimit}`;
    }
}

function findNearestObject(x, y) {
    let closest = null;
    let minDist = Infinity;
    [...shops, ...houses].forEach(obj => {
        const dist = Math.hypot(x - (obj.x + obj.width / 2), y - (obj.y + obj.height / 2));
        if (dist < minDist && dist < 50) {
            minDist = dist;
            closest = obj;
        }
    });
    return closest;
}

// Pathfinding
function findPath(bike) {
    if (!bike.target) return [];
    const start = { x: bike.x, y: bike.y };
    const end = { x: bike.target.x + bike.target.width / 2, y: bike.target.y + bike.target.height / 2 };
    const path = [];
    let current = start;

    // Simple greedy pathfinding along roads
    while (Math.hypot(current.x - end.x, current.y - end.y) > BIKE.speed) {
        let nextRoad = roads.reduce((best, road) => {
            const distToStart = Math.hypot(current.x - road.start.x, current.y - road.start.y);
            const distToEnd = Math.hypot(current.x - road.end.x, current.y - road.end.y);
            const toTarget = Math.hypot(road.end.x - end.x, road.end.y - end.y);
            if (distToStart < 50 && toTarget < (best.toTarget || Infinity)) {
                return { road, toTarget, next: road.end };
            } else if (distToEnd < 50 && toTarget < (best.toTarget || Infinity)) {
                return { road, toTarget, next: road.start };
            }
            return best;
        }, { toTarget: Infinity });

        if (nextRoad.road) {
            path.push(nextRoad.next);
            current = nextRoad.next;
            nextRoad.road.traffic++;
        } else {
            path.push(end);
            break;
        }
    }
    return path;
}

function assignTarget(bike) {
    bike.target = houses.reduce((best, house) => 
        house.demand > 0 && (!best || house.demand > best.demand) ? house : best, null);
    if (bike.target) {
        bike.path = findPath(bike);
        bike.target.demand--;
    }
}

// Game logic
function update() {
    if (!gameActive) return;

    time += 1 / 60;

    // Spawn logic
    if (time > day * 10 && Math.random() < 0.005) spawnShop();
    if (time > day * 5 && Math.random() < 0.01) spawnHouse();

    // House demand
    houses.forEach(house => {
        house.timer += 1 / 60;
        if (house.timer > 10) {
            house.demand++;
            house.timer = 0;
        }
    });

    // Bike management
    shops.forEach(shop => {
        if (Math.random() < 0.02 && bikes.length < day * 5) spawnBike(shop);
    });

    bikes.forEach((bike, index) => {
        if (!bike.target || bike.path.length === 0) {
            assignTarget(bike);
        }
        if (bike.path.length > 0) {
            const next = bike.path[0];
            const dx = next.x - bike.x;
            const dy = next.y - bike.y;
            const dist = Math.hypot(dx, dy);
            if (dist < BIKE.speed) {
                bike.x = next.x;
                bike.y = next.y;
                bike.path.shift();
                bike.stuck = 0;
            } else {
                const trafficFactor = roads.some(r => r.traffic > 5 && Math.hypot(bike.x - r.start.x, bike.y - r.start.y) < 20) ? 0.5 : 1;
                bike.x += (dx / dist) * bike.speed * trafficFactor;
                bike.y += (dy / dist) * bike.speed * trafficFactor;
                bike.stuck += 1 / 60;
            }
            if (bike.stuck > 5) assignTarget(bike); // Re-path if stuck
        } else if (bike.target) {
            score += 10;
            bikes.splice(index, 1);
            scoreDisplay.textContent = `Score: ${score}`;
        }
    });

    // Day progression and game over
    if (time > 30 * day) {
        day++;
        roadLimit += 2; // Bonus roads per day
        roadsDisplay.textContent = `Roads: ${roadLimit}`;
        dayDisplay.textContent = `Day: ${day}`;
    }

    if (houses.some(h => h.demand > 5)) {
        gameActive = false;
        alert(`Game Over! Day: ${day}, Score: ${score}`);
        resetGame();
    }

    roads.forEach(r => r.traffic = Math.max(0, r.traffic - 0.1)); // Decay traffic
}

// Drawing
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Roads
    roads.forEach(road => {
        ctx.strokeStyle = road.traffic > 5 ? '#FF4444' : road.color; // Red if congested
        ctx.lineWidth = road.width;
        ctx.beginPath();
        ctx.moveTo(road.start.x, road.start.y);
        ctx.lineTo(road.end.x, road.end.y);
        ctx.stroke();
    });

    // Preview road
    if (isDragging && previewRoad) {
        ctx.strokeStyle = 'rgba(102, 102, 102, 0.5)';
        ctx.lineWidth = ROAD.width;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(previewRoad.x, previewRoad.y);
        ctx.stroke();
    }

    // Shops
    shops.forEach(shop => {
        ctx.fillStyle = shop.color;
        ctx.fillRect(shop.x, shop.y, shop.width, shop.height);
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.fillText('P', shop.x + 10, shop.y + 20);
    });

    // Houses
    houses.forEach(house => {
        ctx.fillStyle = house.demand > 3 ? '#FF9999' : house.color; // Red tint if high demand
        ctx.fillRect(house.x, house.y, house.width, house.height);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(house.demand, house.x + 5, house.y + 15);
    });

    // Bikes
    bikes.forEach(bike => {
        ctx.fillStyle = bike.stuck > 2 ? '#FF4444' : bike.color; // Red if stuck
        ctx.beginPath();
        ctx.arc(bike.x, bike.y, bike.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // UI
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.fillText(`Time: ${Math.floor(time)}s`, 10, canvas.height - 10);
}

// Reset
function resetGame() {
    score = 0;
    day = 1;
    time = 0;
    roadLimit = 10;
    shops.length = 0;
    houses.length = 0;
    roads.length = 0;
    bikes.length = 0;
    gameActive = true;
    scoreDisplay.textContent = `Score: ${score}`;
    dayDisplay.textContent = `Day: ${day}`;
    roadsDisplay.textContent = `Roads: ${roadLimit}`;
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
