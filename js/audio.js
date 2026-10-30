/**
 * RoletaZapp - Gerenciador de Áudio com Web Audio API
 * Efeitos sonoros sintetizados nativamente sem necessidade de arquivos externos.
 */

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.lastTickTime = 0;
        this.minTickInterval = 0.035; // Previne clipping em rotação super rápida
        this.initOnFirstInteraction();
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    initOnFirstInteraction() {
        const unlock = () => {
            this.init();
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
    }

    setMuted(mute) {
        this.muted = mute;
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    /**
     * Som de 'tick' da agulha da roleta batendo nos pinos
     * @param {number} speedRatio Fator de velocidade (0 a 1) para modular o pitch
     */
    playTick(speedRatio = 0.5) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        if (now - this.lastTickTime < this.minTickInterval) {
            return;
        }
        this.lastTickTime = now;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            // Configuração do filtro passa-banda para som amadeirado / estalado
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600 + speedRatio * 800, now);
            filter.Q.setValueAtTime(3.5, now);

            // Tipo de onda triangular com breve pitch drop
            osc.type = 'triangle';
            const baseFreq = 380 + Math.random() * 80 + speedRatio * 200;
            osc.frequency.setValueAtTime(baseFreq * 1.8, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.04);

            // Envelope de volume rápido e percussivo
            const volume = Math.min(0.25, 0.08 + speedRatio * 0.2);
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {
            // Silencioso em caso de restrição do navegador
        }
    }

    /**
     * Efeito sonoro triunfante de campeão / vitória
     */
    playWinFanfare() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Notas da fanfarra triunfante (DÓ Maior: C4, E4, G4, C5, E5, G5)
        const notes = [
            { freq: 261.63, time: 0.00, dur: 0.12 }, // C4
            { freq: 329.63, time: 0.10, dur: 0.12 }, // E4
            { freq: 392.00, time: 0.20, dur: 0.14 }, // G4
            { freq: 523.25, time: 0.32, dur: 0.35 }, // C5
            { freq: 392.00, time: 0.55, dur: 0.14 }, // G4
            { freq: 523.25, time: 0.68, dur: 0.60 }, // C5 final
            { freq: 659.25, time: 0.68, dur: 0.60 }, // E5 harmonia
            { freq: 783.99, time: 0.68, dur: 0.85 }, // G5 harmonia
            { freq: 1046.50, time: 0.70, dur: 0.90 } // C6 topo glorioso
        ];

        notes.forEach(n => {
            const startTime = now + n.time;
            const stopTime = startTime + n.dur;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.freq, startTime);

            // Envelope ADSR
            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, stopTime);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(stopTime + 0.05);
        });

        // Som adicional de brilho/shimmer estelar
        for (let i = 0; i < 4; i++) {
            const sparkleStart = now + 0.75 + i * 0.12;
            const sOsc = this.ctx.createOscillator();
            const sGain = this.ctx.createGain();

            sOsc.type = 'sine';
            sOsc.frequency.setValueAtTime(1200 + i * 350, sparkleStart);

            sGain.gain.setValueAtTime(0.08, sparkleStart);
            sGain.gain.exponentialRampToValueAtTime(0.0001, sparkleStart + 0.2);

            sOsc.connect(sGain);
            sGain.connect(this.ctx.destination);

            sOsc.start(sparkleStart);
            sOsc.stop(sparkleStart + 0.22);
        }
    }

    /**
     * Clique suave para interações de botão
     */
    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }
}

// Exporta singleton global
window.soundManager = new SoundManager();
