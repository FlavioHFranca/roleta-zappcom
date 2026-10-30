/**
 * RoletaZapp - Motor da Roleta em HTML5 Canvas
 * Renderização em alta definição (HiDPI), animação suave com física de desaceleração,
 * agulha interativa que estala com os pinos e cálculo exato de vencedor.
 */

class FortuneWheel {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.items = options.items || ['Ali', 'Beatriz', 'Charles', 'Diya', 'Eric', 'Fatima', 'Gabriel'];
        this.duration = options.duration || 6; // Duração em segundos (configurável)
        this.onSpinStart = options.onSpinStart || null;
        this.onSpinEnd = options.onSpinEnd || null;
        this.onTick = options.onTick || null;

        // Estado do giro
        this.currentAngle = 0; // Ângulo atual em radianos
        this.isSpinning = false;
        this.startTime = 0;
        this.startAngle = 0;
        this.targetAngle = 0;
        this.spinDurationMs = this.duration * 1000;

        // Física da agulha (Pointer)
        this.pointerAngle = 0; // Posição da agulha: 0 radianos = Lado Direito (3 horas), estilo Wheel of Names
        this.pointerDeflection = 0; // Desvio da agulha ao passar pelos pinos
        this.lastSliceIndex = -1;

        // Paletas de cores para as fatias
        this.colorPalettes = {
            wheelOfNames: [
                '#6ee7b7', // Menta suave
                '#93c5fd', // Azul claro
                '#fde047', // Amarelo sol
                '#c4b5fd', // Lavanda
                '#fed7aa', // Pêssego
                '#67e8f9', // Ciano
                '#fca5a5'  // Rosa salmão
            ],
            royalBlue: [
                '#1d4ed8', // Azul royal escuro
                '#3b82f6', // Azul royal vibrante
                '#60a5fa', // Azul celeste
                '#93c5fd', // Azul suave
                '#2563eb', // Azul padrão
                '#1e40af', // Índigo profundo
                '#38bdf8'  // Sky blue
            ],
            vibrant: [
                '#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6',
                '#06b6d4', '#10b981', '#84cc16', '#eab308', '#f97316'
            ],
            sunset: [
                '#f97316', '#fb923c', '#fbbf24', '#f43f5e', '#e11d48', '#be123c', '#fdba74'
            ],
            emerald: [
                '#059669', '#10b981', '#34d399', '#6ee7b7', '#047857', '#0f766e', '#14b8a6'
            ]
        };

        this.activePalette = 'wheelOfNames';

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.draw();
    }

    setItems(items) {
        this.items = items.map(s => s.trim()).filter(s => s.length > 0);
        this.draw();
    }

    setDuration(seconds) {
        this.duration = Math.max(1, Math.min(60, Number(seconds) || 5));
        this.spinDurationMs = this.duration * 1000;
    }

    setPalette(paletteKey) {
        if (this.colorPalettes[paletteKey]) {
            this.activePalette = paletteKey;
            this.draw();
        }
    }

    setCustomSliceColors(colorsArray) {
        if (Array.isArray(colorsArray) && colorsArray.length > 0) {
            this.colorPalettes.custom = colorsArray;
            this.activePalette = 'custom';
            this.draw();
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        // Tamanho quadrado baseado no container
        const size = Math.min(rect.width, rect.height || rect.width, 700);
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;

        this.ctx.scale(dpr, dpr);
        this.size = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
        this.radius = (size / 2) - 18; // Margem para agulha e bordas

        this.draw();
    }

    /**
     * Inicia o giro suave da roleta
     */
    spin(targetIndex = null) {
        if (this.isSpinning || this.items.length === 0) return false;

        this.isSpinning = true;
        this.startTime = performance.now();
        this.startAngle = this.currentAngle;

        // Se nenhum vencedor específico foi solicitado, escolhe um aleatoriamente
        const winnerIndex = targetIndex !== null
            ? targetIndex
            : Math.floor(Math.random() * this.items.length);

        const sliceAngle = (Math.PI * 2) / this.items.length;

        // Número de voltas completas baseado na duração para velocidade visual equilibrada
        // Ex: 5 segundos => cerca de 6 a 9 voltas completas
        const fullRotations = Math.floor(this.duration * 1.5) + Math.floor(Math.random() * 2) + 4;

        // A agulha fica no ângulo pointerAngle (0 rad = 3 horas).
        // Queremos que no final da rotação, o centro da fatia winnerIndex fique sob a agulha.
        // Centro da fatia i no sistema da roleta: angle = (winnerIndex + 0.5) * sliceAngle
        // Com a roleta rodando no sentido horário, pointerAngle = currentAngle + sliceCenterAngle
        // => targetAngle final % (2*PI) = (pointerAngle - (winnerIndex + 0.5) * sliceAngle)
        const sliceCenter = (winnerIndex + 0.5) * sliceAngle;
        // Adiciona pequena variação aleatória dentro da fatia (entre 20% e 80% da fatia) para parecer natural
        const randomInSlice = (Math.random() * 0.6 + 0.2) * sliceAngle;
        const sliceRandomPos = winnerIndex * sliceAngle + randomInSlice;

        let endAngle = this.pointerAngle - sliceRandomPos;
        // Garante que giramos para a frente sempre
        while (endAngle <= this.startAngle) {
            endAngle += Math.PI * 2;
        }
        endAngle += fullRotations * Math.PI * 2;

        this.targetAngle = endAngle;

        if (this.onSpinStart) {
            this.onSpinStart();
        }

        requestAnimationFrame((time) => this.animate(time));
        return true;
    }

    /**
     * Easing Quartic Out: curva de desaceleração suave, realista e fluida
     */
    easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }

    animate(time) {
        const elapsed = time - this.startTime;
        const progress = Math.min(elapsed / this.spinDurationMs, 1);
        const ease = this.easeOutQuart(progress);

        // Velocidade atual estimada (para controlar pitch do som e agulha)
        const speedRatio = Math.max(0, 1 - progress);

        this.currentAngle = this.startAngle + (this.targetAngle - this.startAngle) * ease;

        // Determina em qual fatia a agulha está passando no momento para som de tick
        this.checkTick(speedRatio);

        // Física da mola da agulha (volta para 0)
        this.pointerDeflection *= 0.82;

        this.draw();

        if (progress < 1) {
            requestAnimationFrame((t) => this.animate(t));
        } else {
            this.currentAngle = this.targetAngle;
            this.isSpinning = false;
            this.pointerDeflection = 0;
            this.draw();

            const winner = this.getCurrentWinner();
            if (this.onSpinEnd) {
                this.onSpinEnd(winner);
            }
        }
    }

    checkTick(speedRatio) {
        if (this.items.length === 0) return;
        const sliceAngle = (Math.PI * 2) / this.items.length;

        // Ângulo local sob a agulha
        let localAngle = (this.pointerAngle - this.currentAngle) % (Math.PI * 2);
        if (localAngle < 0) localAngle += Math.PI * 2;

        const currentSliceIndex = Math.floor(localAngle / sliceAngle);

        if (currentSliceIndex !== this.lastSliceIndex) {
            this.lastSliceIndex = currentSliceIndex;

            // Deflexão visual da agulha
            this.pointerDeflection = -Math.min(0.35, 0.15 + speedRatio * 0.2);

            // Som de tick
            if (this.onTick) {
                this.onTick(speedRatio);
            }
        }
    }

    getCurrentWinner() {
        if (this.items.length === 0) return null;
        const sliceAngle = (Math.PI * 2) / this.items.length;

        let localAngle = (this.pointerAngle - this.currentAngle) % (Math.PI * 2);
        if (localAngle < 0) localAngle += Math.PI * 2;

        const index = Math.floor(localAngle / sliceAngle) % this.items.length;
        return {
            index,
            name: this.items[index]
        };
    }

    getContrastColor(hexColor) {
        // Converte hex para RGB e decide entre preto suave ou branco
        let color = hexColor.replace('#', '');
        if (color.length === 3) {
            color = color.split('').map(c => c + c).join('');
        }
        const r = parseInt(color.substr(0, 2), 16) || 0;
        const g = parseInt(color.substr(2, 2), 16) || 0;
        const b = parseInt(color.substr(4, 2), 16) || 0;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.58 ? '#111827' : '#ffffff';
    }

    draw() {
        if (!this.ctx || !this.size) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.size, this.size);

        const count = this.items.length;

        // Se estiver vazia, desenha roleta de placeholder
        if (count === 0) {
            this.drawEmptyWheel();
            return;
        }

        const sliceAngle = (Math.PI * 2) / count;
        const palette = this.colorPalettes[this.activePalette] || this.colorPalettes.wheelOfNames;

        ctx.save();
        ctx.translate(this.centerX, this.centerY);

        // Sombra suave externa da roleta
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        ctx.fill();
        ctx.restore();

        // Rotação da roleta
        ctx.rotate(this.currentAngle);

        // Desenho das fatias
        for (let i = 0; i < count; i++) {
            const startAngle = i * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            const color = palette[i % palette.length];

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // Divisores sutis entre as fatias
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Desenho do Texto na Fatia
            this.drawSliceText(this.items[i], startAngle, sliceAngle, color);
        }

        // Borda externa elegante da roleta
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore(); // Restaura rotação da roleta

        // Desenha os pinos de metal na borda externa da roleta
        this.drawPegs(count);

        // Desenha o cubo central (Centro branco com anel metálico, igual na foto)
        this.drawCenterHub();

        // Desenha o ponteiro / agulha indicadora (Lado direito, apontando para dentro)
        this.drawPointer();
    }

    drawSliceText(text, startAngle, sliceAngle, sliceColor) {
        const ctx = this.ctx;
        ctx.save();

        // Rotaciona para o centro exato da fatia
        const midAngle = startAngle + sliceAngle / 2;
        ctx.rotate(midAngle);

        // Determina cor de contraste legível
        ctx.fillStyle = this.getContrastColor(sliceColor);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        // Ajusta tamanho da fonte dinamicamente pelo número de itens e comprimento do texto
        const maxLen = Math.max(text.length, 6);
        let fontSize = Math.floor(Math.min(26, Math.max(13, (this.radius * 0.8) / (maxLen * 0.7))));
        
        // Se houver muitas fatias, reduz o tamanho da fonte para não sobrepor
        if (this.items.length > 20) {
            fontSize = Math.min(fontSize, 15);
        } else if (this.items.length > 35) {
            fontSize = Math.min(fontSize, 12);
        }

        ctx.font = `600 ${fontSize}px "Outfit", "Segoe UI", sans-serif`;

        // Posição ao longo do raio (do centro para a borda)
        const textDistance = this.radius - 24;

        // Trunca texto se for excessivamente longo
        let displayText = text;
        if (text.length > 24) {
            displayText = text.substring(0, 22) + '…';
        }

        // Leve sombra no texto para máxima legibilidade
        ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(displayText, textDistance, 0);

        ctx.restore();
    }

    drawPegs(count) {
        // Pinos decorativos na borda externa
        const ctx = this.ctx;
        const pegRadius = Math.min(4, Math.max(2.5, 30 / count));
        const sliceAngle = (Math.PI * 2) / count;

        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.currentAngle);

        for (let i = 0; i < count; i++) {
            const angle = i * sliceAngle;
            const x = Math.cos(angle) * (this.radius - 5);
            const y = Math.sin(angle) * (this.radius - 5);

            ctx.beginPath();
            ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 2;
            ctx.fill();
        }

        ctx.restore();
    }

    drawCenterHub() {
        const ctx = this.ctx;
        const hubRadius = Math.max(28, this.radius * 0.17);

        ctx.save();
        ctx.translate(this.centerX, this.centerY);

        // Sombra profunda do centro
        ctx.beginPath();
        ctx.arc(0, 0, hubRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fill();

        // Anel metálico externo
        const gradRing = ctx.createLinearGradient(-hubRadius, -hubRadius, hubRadius, hubRadius);
        gradRing.addColorStop(0, '#e2e8f0');
        gradRing.addColorStop(0.5, '#ffffff');
        gradRing.addColorStop(1, '#94a3b8');

        ctx.beginPath();
        ctx.arc(0, 0, hubRadius + 2, 0, Math.PI * 2);
        ctx.fillStyle = gradRing;
        ctx.fill();

        // Centro branco puro (igual foto da referência)
        ctx.beginPath();
        ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Detalhe sutil central ou ícone de giro
        ctx.beginPath();
        ctx.arc(0, 0, hubRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#f1f5f9';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    drawPointer() {
        const ctx = this.ctx;
        const pRadius = this.radius;

        ctx.save();
        ctx.translate(this.centerX, this.centerY);

        // A agulha fica na posição 0 rad (lado direito, exatamente como no screenshot da foto)
        // Adicionamos a deflexão causada pelo atrito dos pinos
        ctx.rotate(this.pointerAngle + this.pointerDeflection);

        // Ponteiro triangular estilizado (dourado/amarelo com gradiente e borda, idêntico à referência)
        const tipX = pRadius - 14;      // Ponta entrando na roleta
        const backX = pRadius + 20;    // Base fora da roleta
        const widthHalf = 15;

        // Sombra do ponteiro
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = -2;
        ctx.shadowOffsetY = 3;

        // Triângulo do ponteiro
        ctx.beginPath();
        ctx.moveTo(tipX, 0);
        ctx.lineTo(backX, -widthHalf);
        ctx.lineTo(backX, widthHalf);
        ctx.closePath();

        const pGrad = ctx.createLinearGradient(tipX, 0, backX, 0);
        pGrad.addColorStop(0, '#fde047'); // Dourado claro brilhante
        pGrad.addColorStop(0.6, '#f59e0b'); // Âmbar
        pGrad.addColorStop(1, '#d97706'); // Dourado escuro

        ctx.fillStyle = pGrad;
        ctx.fill();

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pino central da base do ponteiro
        ctx.beginPath();
        ctx.arc(backX - 4, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }

    drawEmptyWheel() {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(this.centerX, this.centerY);

        // Círculo cinza escuro translúcido com mensagem
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 18px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Adicione nomes para começar!', 0, -10);

        ctx.fillStyle = '#64748b';
        ctx.font = '400 14px "Outfit", sans-serif';
        ctx.fillText('Digite no campo de adicionar ao lado', 0, 18);

        ctx.restore();
    }
}

window.FortuneWheel = FortuneWheel;
