// =========================================
//  CALC_X Ultra — JS Logic + Particles
// =========================================

// --- STATE ---
let current = "0";
let previous = "";
let operator = null;
let shouldReset = false;
let justEvaluated = false;
let history = [];

// --- DOM ---
const display    = document.getElementById("display");
const expression = document.getElementById("expression");
const historyText= document.getElementById("historyText");
const modeLabel  = document.getElementById("modeLabel");
const themeToggle= document.getElementById("themeToggle");
const themeIcon  = document.getElementById("themeIcon");
const html       = document.documentElement;

// --- FORMAT NUMBER ---
function fmt(val) {
    if (isNaN(val) || !isFinite(val)) return val;
    let n = parseFloat(val);
    if (Math.abs(n) >= 1e12) return n.toExponential(4);
    return parseFloat(n.toPrecision(12)).toString();
}

// --- UPDATE DISPLAY ---
function setDisplay(val) {
    display.classList.remove("error");
    display.textContent = fmt(val);
    display.classList.add("pop");
    setTimeout(() => display.classList.remove("pop"), 150);
}

function setExpr(text) {
    expression.textContent = text || "\u00a0";
}

function addHistory(text) {
    history.unshift(text);
    if (history.length > 5) history.pop();
    historyText.textContent = history[0] || "—";
}

// --- NUMBER INPUT ---
function inputNumber(val) {
    if (shouldReset || justEvaluated) {
        current = val === "." ? "0." : val;
        shouldReset = false;
        justEvaluated = false;
    } else {
        if (val === "." && current.includes(".")) return;
        if (current === "0" && val !== ".") current = val;
        else {
            if (current.replace("-","").replace(".","").length >= 12) return;
            current += val;
        }
    }
    setDisplay(current);
}

// --- OPERATOR ---
function inputOperator(op) {
    justEvaluated = false;
    document.querySelectorAll(".o-btn").forEach(b => b.classList.remove("active-op"));

    if (operator && !shouldReset) calculate(true);

    previous = current;
    operator = op;
    shouldReset = true;
    setExpr(fmt(previous) + " " + op);

    document.querySelectorAll(".o-btn").forEach(b => {
        if (b.dataset.value === op) b.classList.add("active-op");
    });
}

// --- CALCULATE ---
function calculate(chaining = false) {
    if (!operator || shouldReset) return;

    let a = parseFloat(previous);
    let b = parseFloat(current);
    let result;

    switch (operator) {
        case "+": result = a + b; break;
        case "−": result = a - b; break;
        case "×": result = a * b; break;
        case "÷":
            if (b === 0) { showError("DIV BY ZERO"); return; }
            result = a / b; break;
        default: return;
    }

    let exprStr = fmt(a) + " " + operator + " " + fmt(b) + " = " + fmt(result);
    if (!chaining) {
        setExpr(exprStr);
        addHistory(exprStr);
    }

    current = fmt(result).toString();
    operator = null;
    shouldReset = true;
    justEvaluated = true;
    setDisplay(current);
    document.querySelectorAll(".o-btn").forEach(b => b.classList.remove("active-op"));

    // Flash glow
    flashDisplay();
}

function showError(msg) {
    display.textContent = msg;
    display.classList.add("error");
    setExpr("ERROR");
    resetState();
}

function flashDisplay() {
    const d = document.querySelector(".display-outer");
    d.style.boxShadow = "0 0 30px rgba(245,200,0,0.5), inset 0 0 20px rgba(245,200,0,0.1)";
    setTimeout(() => d.style.boxShadow = "", 300);
}

// --- RESET ---
function resetState() {
    current = "0"; previous = ""; operator = null;
    shouldReset = false; justEvaluated = false;
}

// --- HANDLE ACTION ---
function handleAction(action, value) {
    switch (action) {
        case "num":       inputNumber(value); break;
        case "op":        inputOperator(value); break;
        case "equal":     calculate(); break;
        case "dot":       inputNumber("."); break;

        case "clear":
            resetState();
            setDisplay("0");
            setExpr("");
            document.querySelectorAll(".o-btn").forEach(b => b.classList.remove("active-op"));
            break;

        case "sign":
            if (current !== "0") {
                current = (parseFloat(current) * -1).toString();
                setDisplay(current);
            }
            break;

        case "percent":
            current = (parseFloat(current) / 100).toString();
            setDisplay(current);
            break;

        case "backspace":
            if (shouldReset || justEvaluated) return;
            current = current.length > 1 ? current.slice(0, -1) : "0";
            setDisplay(current);
            break;

        case "sqrt": {
            let n = parseFloat(current);
            if (n < 0) { showError("NO IMAGINARY"); return; }
            let r = Math.sqrt(n);
            let expr = "√(" + fmt(current) + ") = " + fmt(r);
            setExpr(expr); addHistory(expr);
            current = fmt(r).toString();
            setDisplay(current); justEvaluated = true;
            flashDisplay();
            break;
        }

        case "square": {
            let r = parseFloat(current) ** 2;
            let expr = "(" + fmt(current) + ")² = " + fmt(r);
            setExpr(expr); addHistory(expr);
            current = fmt(r).toString();
            setDisplay(current); justEvaluated = true;
            flashDisplay();
            break;
        }

        case "inverse": {
            if (parseFloat(current) === 0) { showError("DIV BY ZERO"); return; }
            let r = 1 / parseFloat(current);
            let expr = "1/(" + fmt(current) + ") = " + fmt(r);
            setExpr(expr); addHistory(expr);
            current = fmt(r).toString();
            setDisplay(current); justEvaluated = true;
            flashDisplay();
            break;
        }
    }
}

// --- BUTTON EVENTS ---
document.querySelectorAll(".btn").forEach(btn => {
    // Ripple position
    btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--rx", ((e.clientX - r.left) / r.width * 100) + "%");
        btn.style.setProperty("--ry", ((e.clientY - r.top) / r.height * 100) + "%");
    });

    btn.addEventListener("click", () => {
        handleAction(btn.dataset.action, btn.dataset.value);
        spawnClickParticles(btn);
    });
});

// --- KEYBOARD ---
document.addEventListener("keydown", (e) => {
    if (e.key >= "0" && e.key <= "9") handleAction("num", e.key);
    else if (e.key === ".") handleAction("dot");
    else if (e.key === "+") handleAction("op", "+");
    else if (e.key === "-") handleAction("op", "−");
    else if (e.key === "*") handleAction("op", "×");
    else if (e.key === "/") { e.preventDefault(); handleAction("op", "÷"); }
    else if (e.key === "Enter" || e.key === "=") handleAction("equal");
    else if (e.key === "Backspace") handleAction("backspace");
    else if (e.key === "Escape") handleAction("clear");
    else if (e.key === "%") handleAction("percent");
});

// --- THEME TOGGLE ---
let isDark = true;

themeToggle.addEventListener("click", () => {
    isDark = !isDark;
    html.setAttribute("data-theme", isDark ? "dark" : "light");
    themeIcon.textContent = isDark ? "☀" : "☾";
    modeLabel.textContent = "MODE: " + (isDark ? "DARK" : "LIGHT");
    themeToggle.style.transition = "transform 0.4s ease";
    themeToggle.style.transform = "rotate(180deg)";
    setTimeout(() => { themeToggle.style.transform = ""; }, 420);
});

// =========================================
//   PARTICLE SYSTEM
// =========================================
const canvas = document.getElementById("particles");
const ctx    = canvas.getContext("2d");
let W, H;
let particles = [];

function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

class Particle {
    constructor(x, y, fromClick) {
        this.x = x || Math.random() * W;
        this.y = y || Math.random() * H;
        this.fromClick = fromClick || false;
        this.size = fromClick ? Math.random() * 4 + 1 : Math.random() * 1.5 + 0.3;
        this.speedX = fromClick ? (Math.random() - 0.5) * 5 : (Math.random() - 0.5) * 0.4;
        this.speedY = fromClick ? (Math.random() - 0.5) * 5 - 2 : (Math.random() - 0.5) * 0.4;
        this.life = fromClick ? 1 : Math.random();
        this.decay = fromClick ? Math.random() * 0.04 + 0.02 : Math.random() * 0.002 + 0.0005;
        this.color = isDark ? `rgba(245,200,0,` : `rgba(180,140,0,`;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        if (this.fromClick) this.speedY += 0.1; // gravity
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + Math.max(0, this.life) + ")";
        ctx.fill();
    }
}

// Seed ambient particles
for (let i = 0; i < 60; i++) particles.push(new Particle());

function animParticles() {
    ctx.clearRect(0, 0, W, H);
    particles = particles.filter(p => p.life > 0);

    // Refill ambient
    while (particles.filter(p => !p.fromClick).length < 60) {
        particles.push(new Particle());
    }

    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animParticles);
}
animParticles();

function spawnClickParticles(btn) {
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(cx, cy, true));
    }
}
