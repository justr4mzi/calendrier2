const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const resetButton = document.getElementById("resetButton");

let drawing = false;
let points = [];
setupCanvas();
canvas.addEventListener("mousedown", (event) => {
    drawing = true;
    points = [];
    ctx.beginPath();
    const { x, y } = getMousePos(event);
    ctx.moveTo(x, y);
});

canvas.addEventListener("mousemove", (event) => {
    if (!drawing) return;

    const { x, y } = getMousePos(event);
    points.push({ x, y });

    ctx.lineTo(x, y);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
    calculateScore();
});

resetButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scoreDisplay.innerText = "Score: 0%";
    points = [];
});

window.addEventListener("resize", setupCanvas);

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.resetTransform(); // Fixes shifting issue
    ctx.scale(dpr, dpr); // Ensures proper rendering without repeated scaling
}

function calculateScore() {
    if (points.length < 5) return;

    let minX = Math.min(...points.map(p => p.x));
    let maxX = Math.max(...points.map(p => p.x));
    let minY = Math.min(...points.map(p => p.y));
    let maxY = Math.max(...points.map(p => p.y));

    let width = maxX - minX;
    let height = maxY - minY;
    let radius = (width + height) / 4; 

    let centerX = (minX + maxX) / 2;
    let centerY = (minY + maxY) / 2;

    let deviations = points.map(p => 
        Math.abs(Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2) - radius)
    );

    let avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    let score = Math.max(0, 100 - avgDeviation * 5); 

    scoreDisplay.innerText = `Score: ${score.toFixed(2)}%`;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
}

