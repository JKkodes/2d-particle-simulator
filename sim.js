const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const gravitySlider = document.getElementById('gravitySlider');
const restitutionSlider = document.getElementById('restitutionSlider');
const countSlider = document.getElementById('countSlider');
const gravityVal = document.getElementById('gravityVal');
const restitutionVal = document.getElementById('restitutionVal');
const countVal = document.getElementById('countVal');
const resetBtn = document.getElementById('resetBtn');

let gravity = parseFloat(gravitySlider.value);
let restitution = parseFloat(restitutionSlider.value);

gravitySlider.addEventListener('input', () => {
    gravity = parseFloat(gravitySlider.value);
    gravityVal.textContent = gravity.toFixed(2);
});
restitutionSlider.addEventListener('input', () => {
    restitution = parseFloat(restitutionSlider.value);
    restitutionVal.textContent = restitution.toFixed(2);
});
countSlider.addEventListener('input', () => {
    countVal.textContent = countSlider.value;
    createBalls(parseInt(countSlider.value));
});
resetBtn.addEventListener('click', () => createBalls(balls.length));

let balls = [];

function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 55%)`;
}

function createBalls(n) {
    balls = [];
    for (let i = 0; i < n; i++) {
        const radius = 12 + Math.random() * 14; // varied sizes look nicer and show mass differences
        balls.push({
            x: radius + Math.random() * (canvas.width - 2 * radius),
            y: Math.random() * canvas.height / 2, // start in upper half
            vx: (Math.random() - 0.5) * 6,
            vy: 0,
            radius: radius,
            mass: radius * radius, // area as a stand-in for 2D "mass" -- bigger balls push smaller ones around more
            color: randomColor()
        });
    }
}
createBalls(parseInt(countSlider.value));

// --- Dragging state ---
let dragging = null;      // the ball currently being dragged
let mouseX = 0, mouseY = 0;
let prevMouseX = 0, prevMouseY = 0; // used to compute throw velocity on release

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) * (canvas.width / rect.width),
        y: (evt.clientY - rect.top) * (canvas.height / rect.height)
    };
}

canvas.addEventListener('mousedown', (evt) => {
    const pos = getMousePos(evt);
    // find topmost ball under the cursor
    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        const dx = pos.x - b.x, dy = pos.y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) < b.radius) {
            dragging = b;
            mouseX = prevMouseX = pos.x;
            mouseY = prevMouseY = pos.y;
            canvas.classList.add('dragging');
            break;
        }
    }
});

window.addEventListener('mousemove', (evt) => {
    if (!dragging) return;
    const pos = getMousePos(evt);
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = pos.x;
    mouseY = pos.y;
});

window.addEventListener('mouseup', () => {
    if (!dragging) return;
    // throw velocity = how fast the mouse was moving right before release
    dragging.vx = (mouseX - prevMouseX);
    dragging.vy = (mouseY - prevMouseY);
    dragging = null;
    canvas.classList.remove('dragging');
});

function update() {
    for (let ball of balls) {
        if (ball === dragging) {
            // while dragging, the ball follows the mouse directly and ignores physics
            ball.x = mouseX;
            ball.y = mouseY;
            ball.vx = 0;
            ball.vy = 0;
            continue;
        }

        ball.vy += gravity;   // gravity pulls down every frame
        ball.x += ball.vx;    // integrate position from velocity
        ball.y += ball.vy;

        // floor
        if (ball.y > canvas.height - ball.radius) {
            ball.y = canvas.height - ball.radius; // clamp so it can't sink into the floor
            ball.vy = -ball.vy * restitution;     // bounce, losing some energy
        }
        // ceiling (only matters if thrown upward hard)
        if (ball.y < ball.radius) {
            ball.y = ball.radius;
            ball.vy = -ball.vy * restitution;
        }

        // walls -- clamp position AND reverse velocity with restitution
        if (ball.x > canvas.width - ball.radius) {
            ball.x = canvas.width - ball.radius;
            ball.vx = -ball.vx * restitution;
        } else if (ball.x < ball.radius) {
            ball.x = ball.radius;
            ball.vx = -ball.vx * restitution;
        }
    }
}

function checkCollisions() {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const a = balls[i];
            const b = balls[j];
            if (a === dragging || b === dragging) continue; // don't fight the mouse

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001; // avoid divide-by-zero if perfectly overlapping
            const minDist = a.radius + b.radius;

            if (dist < minDist) {
                // collision normal: the unit vector pointing from a's center to b's center
                const nx = dx / dist;
                const ny = dy / dist;
                // tangent: perpendicular to the normal
                const tx = -ny;
                const ty = nx;

                // 1. push apart so they don't overlap
                const overlap = minDist - dist;
                a.x -= nx * overlap / 2;
                a.y -= ny * overlap / 2;
                b.x += nx * overlap / 2;
                b.y += ny * overlap / 2;

                // 2. split each velocity into normal + tangential components
                const v1n = a.vx * nx + a.vy * ny;
                const v1t = a.vx * tx + a.vy * ty;
                const v2n = b.vx * nx + b.vy * ny;
                const v2t = b.vx * tx + b.vy * ty;

                // 3. only the NORMAL components change in a collision (tangential
                //    velocity -- the "sliding past each other" part -- is untouched)
                //    this is the standard 1D collision-with-restitution formula,
                //    applied along the normal axis, weighted by mass
                const m1 = a.mass, m2 = b.mass;
                const e = restitution;
                const v1nAfter = (m1 * v1n + m2 * v2n + m2 * e * (v2n - v1n)) / (m1 + m2);
                const v2nAfter = (m1 * v1n + m2 * v2n + m1 * e * (v1n - v2n)) / (m1 + m2);

                // 4. recombine normal + tangential back into x/y velocity
                a.vx = v1nAfter * nx + v1t * tx;
                a.vy = v1nAfter * ny + v1t * ty;
                b.vx = v2nAfter * nx + v2t * tx;
                b.vy = v2nAfter * ny + v2t * ty;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        if (ball === dragging) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333';
            ctx.stroke();
        }
    }
}

function loop() {
    update();
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
}
loop();