/**
 * RoletaZapp - Sistema de Confetes e Partículas de Celebração
 * Renderizado em canvas full-screen a 60fps com física realista
 */

class ConfettiSystem {
    constructor(canvasId = 'confetti-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isActive = false;

        this.colors = [
            '#2563eb', '#38bdf8', '#fbbf24', '#f59e0b',
            '#10b981', '#ec4899', '#8b5cf6', '#ef4444',
            '#ffffff', '#ffd700', '#06b6d4'
        ];

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    /**
     * Dispara grande celebração de campeão
     */
    launchCelebration(durationMs = 4000) {
        this.clear();
        this.isActive = true;

        // Disparo inicial explosivo de ambos os lados e centro
        this.spawnBurst(this.width * 0.15, this.height * 0.7, 70, 75, -55);
        this.spawnBurst(this.width * 0.85, this.height * 0.7, 70, 105, -125);
        this.spawnBurst(this.width * 0.5, this.height * 0.6, 90, 60, -90);

        // Disparos contínuos secundários
        const interval = setInterval(() => {
            if (!this.isActive) {
                clearInterval(interval);
                return;
            }
            this.spawnBurst(
                this.width * (0.2 + Math.random() * 0.6),
                this.height * (0.3 + Math.random() * 0.3),
                35,
                40 + Math.random() * 40,
                -90 + (Math.random() * 60 - 30)
            );
        }, 500);

        setTimeout(() => {
            clearInterval(interval);
            setTimeout(() => {
                if (this.particles.length === 0) {
                    this.stop();
                }
            }, 2500);
        }, durationMs);

        if (!this.animationId) {
            this.loop();
        }
    }

    spawnBurst(x, y, count, speed, baseAngleDeg) {
        for (let i = 0; i < count; i++) {
            const angle = (baseAngleDeg + (Math.random() * 60 - 30)) * (Math.PI / 180);
            const velocity = (speed * 0.6) + Math.random() * (speed * 0.8);
            const size = 6 + Math.random() * 8;
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            const shape = Math.random() > 0.4 ? 'rect' : (Math.random() > 0.5 ? 'circle' : 'star');

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity * 0.3,
                vy: Math.sin(angle) * velocity * 0.3,
                gravity: 0.15 + Math.random() * 0.1,
                drag: 0.965,
                w: size,
                h: size * (shape === 'rect' ? (1 + Math.random() * 1.5) : 1),
                color,
                shape,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                wobble: Math.random() * 10,
                wobbleSpeed: 0.05 + Math.random() * 0.08,
                alpha: 1,
                decay: 0.003 + Math.random() * 0.005
            });
        }
    }

    loop() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Atualização física
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;

            p.rotation += p.rotationSpeed;
            p.wobble += p.wobbleSpeed;
            p.alpha -= p.decay;

            if (p.alpha <= 0 || p.y > this.height + 50) {
                this.particles.splice(i, 1);
                continue;
            }

            // Renderização da partícula
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillStyle = p.color;

            const wobbleScale = Math.sin(p.wobble);

            if (p.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.w * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.shape === 'star') {
                this.drawStar(0, 0, 5, p.w * 0.6, p.w * 0.3);
                this.ctx.fill();
            } else {
                // Rect com escala de wobble simulando rotação 3D
                this.ctx.fillRect(-p.w / 2, (-p.h / 2) * wobbleScale, p.w, p.h * Math.abs(wobbleScale));
            }

            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.loop());
        } else {
            this.animationId = null;
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
    }

    clear() {
        this.particles = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.clear();
    }
}

window.confettiSystem = new ConfettiSystem();
