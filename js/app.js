/**
 * RoletaZapp - Controlador Principal da Aplicação
 * Gerenciamento de estado, interface, persistência local e eventos de usuário.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Itens padrão (inspirados no screenshot original enviado pelo usuário)
    // Inicia zerado conforme solicitado pelo usuário
    const DEFAULT_ITEMS = [];

    // Elementos DOM
    const wheelCanvas = document.getElementById('wheel-canvas');
    const wheelContainer = document.getElementById('wheel-container');
    const btnSpinMain = document.getElementById('btn-spin-main');

    const tabEntriesBtn = document.getElementById('tab-entries-btn');
    const tabResultsBtn = document.getElementById('tab-results-btn');
    const tabEntries = document.getElementById('tab-entries');
    const tabResults = document.getElementById('tab-results');

    const entriesItemsList = document.getElementById('entries-items-list');
    const emptyEntriesMsg = document.getElementById('empty-entries-msg');
    const entriesListCounter = document.getElementById('entries-list-counter');
    const entriesCountBadge = document.getElementById('entries-count-badge');
    const resultsCountBadge = document.getElementById('results-count-badge');

    const quickAddForm = document.getElementById('quick-add-form');
    const quickAddInput = document.getElementById('quick-add-input');

    const btnShuffle = document.getElementById('btn-shuffle');
    const btnSort = document.getElementById('btn-sort');
    const btnPresets = document.getElementById('btn-presets');
    const btnClearEntries = document.getElementById('btn-clear-entries');

    const durationSlider = document.getElementById('duration-slider');
    const durationValBadge = document.getElementById('duration-val-badge');
    const autoRemoveSwitch = document.getElementById('auto-remove-switch');
    const hidePanelSwitch = document.getElementById('hide-panel-switch');

    const resultsListContainer = document.getElementById('results-list-container');
    const emptyResultsMsg = document.getElementById('empty-results-msg');
    const btnClearResults = document.getElementById('btn-clear-results');

    // Modais
    const winnerModalBackdrop = document.getElementById('winner-modal-backdrop');
    const winnerNameText = document.getElementById('winner-name-text');
    const btnModalClose = document.getElementById('btn-modal-close');
    const btnModalRemove = document.getElementById('btn-modal-remove');

    const themeModalBackdrop = document.getElementById('theme-modal-backdrop');
    const btnThemeModal = document.getElementById('btn-theme-modal');
    const btnCloseThemeModal = document.getElementById('btn-close-theme-modal');

    const presetsModalBackdrop = document.getElementById('presets-modal-backdrop');
    const btnClosePresetsModal = document.getElementById('btn-close-presets-modal');

    const btnMuteToggle = document.getElementById('btn-mute-toggle');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');
    const soundText = document.getElementById('sound-text');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebarToggleText = document.getElementById('sidebar-toggle-text');

    // Estado da Aplicação
    let state = {
        items: [],
        results: [],
        duration: 5,
        autoRemove: true,
        hidePanelOnSpin: true,
        sidebarHidden: false,
        theme: 'royal-blue',
        palette: 'wheelOfNames',
        currentWinner: null
    };

    // =========================================================================
    // 1. Carregamento e Persistência de Estado (LocalStorage)
    // =========================================================================
    function loadState() {
        try {
            const isV2 = localStorage.getItem('roletazapp_v2');
            if (!isV2) {
                // Primeira execução: zera a lista para começar totalmente limpa
                state.items = [];
                state.results = [];
                localStorage.setItem('roletazapp_v2', 'true');
            } else {
                const savedItems = localStorage.getItem('roletazapp_items');
                state.items = savedItems ? JSON.parse(savedItems) : [];

                const savedResults = localStorage.getItem('roletazapp_results');
                state.results = savedResults ? JSON.parse(savedResults) : [];
            }

            const savedDuration = localStorage.getItem('roletazapp_duration');
            state.duration = savedDuration ? parseInt(savedDuration, 10) : 5;

            const savedAutoRemove = localStorage.getItem('roletazapp_autoremove');
            state.autoRemove = savedAutoRemove !== null ? JSON.parse(savedAutoRemove) : true;

            const savedHidePanel = localStorage.getItem('roletazapp_hide_panel');
            state.hidePanelOnSpin = savedHidePanel !== null ? JSON.parse(savedHidePanel) : true;

            const savedTheme = localStorage.getItem('roletazapp_theme');
            state.theme = savedTheme || 'royal-blue';

            const savedPalette = localStorage.getItem('roletazapp_palette');
            state.palette = savedPalette || 'wheelOfNames';
        } catch (e) {
            state.items = [];
            state.results = [];
        }
    }

    function saveState() {
        try {
            localStorage.setItem('roletazapp_items', JSON.stringify(state.items));
            localStorage.setItem('roletazapp_results', JSON.stringify(state.results));
            localStorage.setItem('roletazapp_duration', state.duration.toString());
            localStorage.setItem('roletazapp_autoremove', JSON.stringify(state.autoRemove));
            localStorage.setItem('roletazapp_hide_panel', JSON.stringify(state.hidePanelOnSpin));
            localStorage.setItem('roletazapp_theme', state.theme);
            localStorage.setItem('roletazapp_palette', state.palette);
        } catch (e) {
            console.error('Erro ao salvar no localStorage', e);
        }
    }

    loadState();

    // =========================================================================
    // 2. Inicialização do Motor da Roleta
    // =========================================================================
    const wheel = new FortuneWheel('wheel-canvas', {
        items: state.items,
        duration: state.duration,
        onSpinStart: () => {
            btnSpinMain.disabled = true;
            btnSpinMain.innerHTML = `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spinIcon 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
                GIRANDO...
            `;
            closeAllModals();

            // Notifica participantes conectados na sessão ao vivo
            notifyHostSpinStart();

            // Esconde configurações e lista durante o giro para foco total na roleta
            if (state.hidePanelOnSpin) {
                const appMain = document.querySelector('.app-main');
                if (appMain) {
                    appMain.classList.add('spinning-mode');
                    setTimeout(() => wheel.resize(), 50);
                    setTimeout(() => wheel.resize(), 250);
                }
            }
        },
        onTick: (speedRatio) => {
            if (window.soundManager) {
                window.soundManager.playTick(speedRatio);
            }
        },
        onSpinEnd: (winner) => {
            btnSpinMain.disabled = false;
            btnSpinMain.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/>
                </svg>
                GIRAR ROLETA
            `;

            if (winner) {
                notifyHostSpinEnd(winner);
                handleWinner(winner);
            }
        }
    });

    wheel.setPalette(state.palette);
    applyTheme(state.theme);

    // =========================================================================
    // 3. Atualização da Interface e Sincronização
    // =========================================================================
    function syncUI() {
        // Atualiza Lista Visual de Nomes
        renderEntries();

        // Atualiza Configurações
        durationSlider.value = state.duration;
        durationValBadge.textContent = `${state.duration}s`;
        autoRemoveSwitch.checked = state.autoRemove;
        if (hidePanelSwitch) {
            hidePanelSwitch.checked = state.hidePanelOnSpin;
        }

        // Sincroniza Roleta
        wheel.setDuration(state.duration);
        wheel.setItems(state.items);

        // Atualiza Resultados
        renderResults();

        saveState();
    }

    function renderEntries() {
        entriesCountBadge.textContent = state.items.length;
        entriesListCounter.textContent = `${state.items.length} adicionado${state.items.length === 1 ? '' : 's'}`;

        if (state.items.length === 0) {
            emptyEntriesMsg.style.display = 'flex';
            entriesItemsList.innerHTML = '';
            return;
        }

        emptyEntriesMsg.style.display = 'none';
        entriesItemsList.innerHTML = '';

        state.items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'entry-item-row';
            li.innerHTML = `
                <div class="entry-item-left">
                    <span class="entry-item-index">${index + 1}</span>
                    <span class="entry-item-text" title="${escapeHtml(item)}">${escapeHtml(item)}</span>
                </div>
                <button type="button" class="btn-remove-entry" title="Remover ${escapeHtml(item)}" data-remove-index="${index}">
                    ✕
                </button>
            `;
            entriesItemsList.appendChild(li);
        });

        // Eventos de clique para apagar cada nome individualmente
        entriesItemsList.querySelectorAll('.btn-remove-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.currentTarget.getAttribute('data-remove-index'), 10);
                if (!isNaN(idx) && idx >= 0 && idx < state.items.length) {
                    state.items.splice(idx, 1);
                    if (window.soundManager) window.soundManager.playClick();
                    syncUI();
                }
            });
        });
    }

    function renderResults() {
        resultsCountBadge.textContent = state.results.length;

        if (state.results.length === 0) {
            emptyResultsMsg.style.display = 'flex';
            resultsListContainer.innerHTML = '';
            return;
        }

        emptyResultsMsg.style.display = 'none';
        resultsListContainer.innerHTML = '';

        state.results.forEach((res, index) => {
            const li = document.createElement('li');
            li.className = 'result-item';
            li.innerHTML = `
                <div class="result-info">
                    <div class="result-rank">#${state.results.length - index}</div>
                    <div>
                        <div class="result-name">${escapeHtml(res.name)}</div>
                        <div class="result-time">${res.time}</div>
                    </div>
                </div>
                <button class="btn-restore-winner" title="Devolver este nome para a roleta" data-restore-index="${index}">
                    Restaurar
                </button>
            `;
            resultsListContainer.appendChild(li);
        });

        // Eventos dos botões restaurar
        resultsListContainer.querySelectorAll('.btn-restore-winner').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-restore-index'), 10);
                restoreWinner(idx);
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========================================================================
    // 4. Lógica do Vencedor e Animação de Campeão
    // =========================================================================
    function handleWinner(winner) {
        state.currentWinner = winner;
        winnerNameText.textContent = winner.name;

        // Registra histórico de resultados
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        state.results.unshift({
            name: winner.name,
            time: timeFormatted,
            timestamp: Date.now()
        });

        // Áudio de vitória triunfante
        if (window.soundManager) {
            window.soundManager.playWinFanfare();
        }

        // Animação de celebração com confetes 60fps
        if (window.confettiSystem) {
            window.confettiSystem.launchCelebration(4500);
        }

        // Exibe modal pop-up com efeito bounce
        openModal(winnerModalBackdrop);

        // Se a opção de desabilitar/remover automaticamente estiver ativada
        if (state.autoRemove) {
            // Remove o item da lista ativa
            removeWinnerFromEntries(winner.name, false);
            btnModalRemove.textContent = 'Removido!';
            btnModalRemove.disabled = true;
        } else {
            btnModalRemove.textContent = 'Remover';
            btnModalRemove.disabled = false;
        }

        renderResults();
        saveState();
    }

    function removeWinnerFromEntries(name, notify = true) {
        const idx = state.items.indexOf(name);
        if (idx !== -1) {
            state.items.splice(idx, 1);
            syncUI();
        }
    }

    function restoreWinner(indexInResults) {
        if (indexInResults >= 0 && indexInResults < state.results.length) {
            const restored = state.results[indexInResults];
            // Insere de volta se não existir
            if (!state.items.includes(restored.name)) {
                state.items.push(restored.name);
            }
            state.results.splice(indexInResults, 1);
            if (window.soundManager) window.soundManager.playClick();
            syncUI();
        }
    }

    // =========================================================================
    // 5. Interações do Usuário e Eventos
    // =========================================================================

    // Giro da roleta
    function triggerSpin() {
        if (wheel.isSpinning) return;
        if (state.items.length === 0) {
            alert('Por favor, adicione pelo menos 1 nome ou produto no campo acima!');
            quickAddInput.focus();
            return;
        }
        wheel.spin();
    }

    btnSpinMain.addEventListener('click', triggerSpin);
    wheelContainer.addEventListener('click', triggerSpin);

    // Inserção rápida de nome (suporta 1 nome ou múltiplos separados por vírgula)
    quickAddForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = quickAddInput.value.trim();
        if (raw) {
            const parts = raw.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
            if (parts.length > 0) {
                state.items.push(...parts);
                quickAddInput.value = '';
                if (window.soundManager) window.soundManager.playClick();
                syncUI();
            }
        }
    });

    // Botão Baralhar / Shuffle
    btnShuffle.addEventListener('click', () => {
        if (state.items.length <= 1) return;
        // Fisher-Yates shuffle
        for (let i = state.items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [state.items[i], state.items[j]] = [state.items[j], state.items[i]];
        }
        if (window.soundManager) window.soundManager.playClick();
        syncUI();
    });

    // Botão Ordenar Alfabeticamente
    btnSort.addEventListener('click', () => {
        if (state.items.length <= 1) return;
        state.items.sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' }));
        if (window.soundManager) window.soundManager.playClick();
        syncUI();
    });

    // Botão Limpar Entradas
    btnClearEntries.addEventListener('click', () => {
        if (state.items.length === 0) return;
        if (confirm('Tem certeza de que deseja limpar todos os nomes da lista?')) {
            state.items = [];
            if (window.soundManager) window.soundManager.playClick();
            syncUI();
        }
    });

    // Botão Limpar Histórico de Resultados
    btnClearResults.addEventListener('click', () => {
        if (state.results.length === 0) return;
        if (confirm('Deseja limpar todo o histórico de vencedores?')) {
            state.results = [];
            if (window.soundManager) window.soundManager.playClick();
            renderResults();
            saveState();
        }
    });

    // Slider de Duração
    durationSlider.addEventListener('input', (e) => {
        state.duration = parseInt(e.target.value, 10);
        durationValBadge.textContent = `${state.duration}s`;
        wheel.setDuration(state.duration);
        saveState();
    });

    // Switch de Remover Vencedor Automaticamente
    autoRemoveSwitch.addEventListener('change', (e) => {
        state.autoRemove = e.target.checked;
        saveState();
    });

    // Switch de Ocultar Painel ao Girar
    if (hidePanelSwitch) {
        hidePanelSwitch.addEventListener('change', (e) => {
            state.hidePanelOnSpin = e.target.checked;
            saveState();
        });
    }

    // Botão de Toggle Manual do Painel Lateral no Header
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            const appMain = document.querySelector('.app-main');
            if (!appMain) return;
            state.sidebarHidden = !state.sidebarHidden;
            if (state.sidebarHidden) {
                appMain.classList.add('sidebar-hidden');
                btnToggleSidebar.classList.add('active');
                if (sidebarToggleText) sidebarToggleText.textContent = 'Ver Painel';
            } else {
                appMain.classList.remove('sidebar-hidden');
                btnToggleSidebar.classList.remove('active');
                if (sidebarToggleText) sidebarToggleText.textContent = 'Painel';
            }
            setTimeout(() => wheel.resize(), 50);
            setTimeout(() => wheel.resize(), 200);
        });
    }

    // Navegação por Abas (Entradas / Resultados)
    tabEntriesBtn.addEventListener('click', () => {
        tabEntriesBtn.classList.add('active');
        tabResultsBtn.classList.remove('active');
        tabEntries.classList.add('active');
        tabResults.classList.remove('active');
    });

    tabResultsBtn.addEventListener('click', () => {
        tabResultsBtn.classList.add('active');
        tabEntriesBtn.classList.remove('active');
        tabResults.classList.add('active');
        tabEntries.classList.remove('active');
    });

    // =========================================================================
    // 6. Controles dos Modais
    // =========================================================================
    function openModal(modalEl) {
        modalEl.classList.add('open');
        modalEl.setAttribute('aria-hidden', 'false');
    }

    function closeModal(modalEl) {
        modalEl.classList.remove('open');
        modalEl.setAttribute('aria-hidden', 'true');
    }

    function closeAllModals() {
        closeModal(winnerModalBackdrop);
        closeModal(themeModalBackdrop);
        closeModal(presetsModalBackdrop);
        if (sessionModalBackdrop) closeModal(sessionModalBackdrop);
    }

    function restoreUIAfterSpin() {
        const appMain = document.querySelector('.app-main');
        if (appMain && appMain.classList.contains('spinning-mode')) {
            appMain.classList.remove('spinning-mode');
            setTimeout(() => {
                wheel.resize();
            }, 50);
            setTimeout(() => {
                wheel.resize();
            }, 250);
        }
    }

    // Modal Vencedor Ações
    btnModalClose.addEventListener('click', () => {
        closeModal(winnerModalBackdrop);
        if (window.confettiSystem) window.confettiSystem.stop();
        restoreUIAfterSpin();
    });

    btnModalRemove.addEventListener('click', () => {
        if (state.currentWinner) {
            removeWinnerFromEntries(state.currentWinner.name);
            btnModalRemove.textContent = 'Removido!';
            btnModalRemove.disabled = true;
        }
        setTimeout(() => {
            closeModal(winnerModalBackdrop);
            if (window.confettiSystem) window.confettiSystem.stop();
            restoreUIAfterSpin();
        }, 300);
    });

    // Modal de Temas e Cores
    btnThemeModal.addEventListener('click', () => openModal(themeModalBackdrop));
    btnCloseThemeModal.addEventListener('click', () => closeModal(themeModalBackdrop));

    // Seleção de Tema
    document.querySelectorAll('[data-theme-val]').forEach(card => {
        card.addEventListener('click', () => {
            const themeKey = card.getAttribute('data-theme-val');
            applyTheme(themeKey);
            state.theme = themeKey;
            document.querySelectorAll('[data-theme-val]').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            saveState();
        });
    });

    function applyTheme(themeKey) {
        if (themeKey === 'royal-blue') {
            document.body.removeAttribute('data-theme');
        } else {
            document.body.setAttribute('data-theme', themeKey);
        }
    }

    // Seleção de Paleta da Roleta
    document.querySelectorAll('[data-palette-val]').forEach(card => {
        card.addEventListener('click', () => {
            const paletteKey = card.getAttribute('data-palette-val');
            wheel.setPalette(paletteKey);
            state.palette = paletteKey;
            document.querySelectorAll('[data-palette-val]').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            saveState();
        });
    });

    // Modal de Presets Rápidos
    btnPresets.addEventListener('click', () => openModal(presetsModalBackdrop));
    btnClosePresetsModal.addEventListener('click', () => closeModal(presetsModalBackdrop));

    const PRESETS = {
        names: ['Ali', 'Beatriz', 'Charles', 'Diya', 'Eric', 'Fatima', 'Gabriel'],
        numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        prizes: ['Pix R$ 100', 'Desconto 20%', 'Vale Compras R$ 50', 'Frete Grátis', 'Brinde Exclusivo', 'Cupom 50%'],
        yesno: ['Sim', 'Não', 'Talvez', 'Tente Novamente'],
        weekdays: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
    };

    document.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.getAttribute('data-preset');
            if (PRESETS[presetKey]) {
                state.items = [...PRESETS[presetKey]];
                if (window.soundManager) window.soundManager.playClick();
                syncUI();
                closeModal(presetsModalBackdrop);
            }
        });
    });

    // Fechar modais ao clicar no fundo
    [winnerModalBackdrop, themeModalBackdrop, presetsModalBackdrop].forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal(backdrop);
                if (backdrop === winnerModalBackdrop) {
                    if (window.confettiSystem) window.confettiSystem.stop();
                    restoreUIAfterSpin();
                }
            }
        });
    });

    // =========================================================================
    // 7. Controles de Cabeçalho (Som, Fullscreen, Teclado)
    // =========================================================================

    // Mute / Unmute
    btnMuteToggle.addEventListener('click', () => {
        const isMuted = window.soundManager.toggleMute();
        if (isMuted) {
            soundIconOn.style.display = 'none';
            soundIconOff.style.display = 'block';
            soundText.textContent = 'Mudo';
            btnMuteToggle.classList.remove('active');
        } else {
            soundIconOn.style.display = 'block';
            soundIconOff.style.display = 'none';
            soundText.textContent = 'Som';
            btnMuteToggle.classList.add('active');
            window.soundManager.playClick();
        }
    });

    // Tela Cheia
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Erro ao ativar tela cheia:', err);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Atalhos de Teclado (Barra de espaço gira a roleta, ESC fecha modais)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            if (window.confettiSystem) window.confettiSystem.stop();
            restoreUIAfterSpin();
            return;
        }

        // Espaço para girar, apenas se o foco não estiver em um input ou textarea
        if (e.code === 'Space') {
            const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            if (tag !== 'input' && tag !== 'textarea') {
                e.preventDefault();
                triggerSpin();
            }
        }
    });

    // =========================================================================
    // 8. Sessão ao Vivo (Multiplayer Estilo Kahoot com PIN e QR Code)
    // =========================================================================
    const btnLiveSession = document.getElementById('btn-live-session');
    const liveSessionBtnText = document.getElementById('live-session-btn-text');
    const sessionTopbar = document.getElementById('session-topbar');
    const topbarUrl = document.getElementById('topbar-url');
    const topbarPin = document.getElementById('topbar-pin');
    const topbarPlayersCount = document.getElementById('topbar-players-count');
    const btnShowQr = document.getElementById('btn-show-qr');
    const sessionModalBackdrop = document.getElementById('session-modal-backdrop');
    const btnCloseSessionModal = document.getElementById('btn-close-session-modal');
    const sessionModalPin = document.getElementById('session-modal-pin');
    const sessionQrContainer = document.getElementById('session-qr-container');
    const sessionModalLink = document.getElementById('session-modal-link');
    const sessionModalPlayersCount = document.getElementById('session-modal-players-count');
    const btnCopyJoinLink = document.getElementById('btn-copy-join-link');

    let hostWs = null;
    let activeSessionPin = null;
    let activeJoinUrl = '';
    const connectedPlayers = new Map();

    function connectHostWebSocket(onReady) {
        if (hostWs && hostWs.readyState === WebSocket.OPEN) {
            if (onReady) onReady();
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        try {
            hostWs = new WebSocket(wsUrl);

            hostWs.onopen = () => {
                console.log('[Host WS] Conectado ao servidor multiplayer');
                if (onReady) onReady();
            };

            hostWs.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleHostServerMessage(data);
                } catch (e) {
                    console.error('[Host WS] Erro ao parsear mensagem:', e);
                }
            };

            hostWs.onclose = () => {
                console.warn('[Host WS] Desconectado. Tentando reconectar...');
                setTimeout(() => {
                    if (activeSessionPin) {
                        connectHostWebSocket();
                    }
                }, 3000);
            };

            hostWs.onerror = (err) => {
                console.error('[Host WS] Erro de conexão:', err);
            };
        } catch (e) {
            console.error('[Host WS] Falha ao iniciar WebSocket:', e);
        }
    }

    function handleHostServerMessage(data) {
        switch (data.type) {
            case 'host:room_created': {
                activeSessionPin = data.pin;
                activeJoinUrl = data.joinUrl;

                const formattedPin = data.pin.length === 6
                    ? `${data.pin.slice(0, 3)} ${data.pin.slice(3)}`
                    : data.pin;

                if (sessionModalPin) sessionModalPin.textContent = formattedPin;
                if (topbarPin) topbarPin.textContent = formattedPin;

                // Formata URL simplificada para exibição
                const cleanDisplayUrl = activeJoinUrl.replace(/^https?:\/\//i, '');
                if (topbarUrl) topbarUrl.textContent = cleanDisplayUrl;
                if (sessionModalLink) sessionModalLink.textContent = activeJoinUrl;

                // Carrega QR Code gerado pelo backend
                if (sessionQrContainer) {
                    sessionQrContainer.innerHTML = `
                        <img src="/api/qr?text=${encodeURIComponent(activeJoinUrl)}" alt="QR Code para entrar" class="qr-code-img" />
                    `;
                }

                if (sessionTopbar) sessionTopbar.style.display = 'block';
                if (liveSessionBtnText) liveSessionBtnText.textContent = `Sessão: ${formattedPin}`;
                if (btnLiveSession) btnLiveSession.classList.add('session-active');

                openModal(sessionModalBackdrop);
                break;
            }

            case 'host:player_joined': {
                const player = data.player;
                if (player) {
                    connectedPlayers.set(player.id, player);
                    const displayName = `${player.emoji} ${player.name}`.trim();

                    // Adiciona na lista da roleta se ainda não estiver
                    if (!state.items.includes(displayName)) {
                        state.items.push(displayName);
                        syncUI();
                    }

                    if (window.soundManager) {
                        window.soundManager.playClick();
                    }
                }

                const count = data.totalPlayers || connectedPlayers.size;
                updatePlayersCountDisplay(count);
                break;
            }

            case 'host:player_left': {
                if (data.playerId) {
                    connectedPlayers.delete(data.playerId);
                }
                const count = data.totalPlayers !== undefined ? data.totalPlayers : connectedPlayers.size;
                updatePlayersCountDisplay(count);
                break;
            }
        }
    }

    function updatePlayersCountDisplay(count) {
        if (topbarPlayersCount) topbarPlayersCount.textContent = count;
        if (sessionModalPlayersCount) {
            sessionModalPlayersCount.textContent = `${count} participante${count === 1 ? '' : 's'} conectado${count === 1 ? '' : 's'}`;
        }
    }

    function notifyHostSpinStart() {
        if (hostWs && hostWs.readyState === WebSocket.OPEN && activeSessionPin) {
            hostWs.send(JSON.stringify({ type: 'host:spin_start' }));
        }
    }

    function notifyHostSpinEnd(winner) {
        if (hostWs && hostWs.readyState === WebSocket.OPEN && activeSessionPin && winner) {
            hostWs.send(JSON.stringify({
                type: 'host:spin_end',
                winner: { name: winner.name }
            }));
        }
    }

    if (btnLiveSession) {
        btnLiveSession.addEventListener('click', () => {
            if (!activeSessionPin) {
                connectHostWebSocket(() => {
                    hostWs.send(JSON.stringify({
                        type: 'host:create_room',
                        clientOrigin: window.location.origin
                    }));
                });
            } else {
                openModal(sessionModalBackdrop);
            }
        });
    }

    if (btnShowQr) {
        btnShowQr.addEventListener('click', () => {
            openModal(sessionModalBackdrop);
        });
    }

    if (btnCloseSessionModal) {
        btnCloseSessionModal.addEventListener('click', () => {
            closeModal(sessionModalBackdrop);
        });
    }

    if (btnCopyJoinLink) {
        btnCopyJoinLink.addEventListener('click', () => {
            if (!activeJoinUrl) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(activeJoinUrl).then(() => {
                    const originalText = btnCopyJoinLink.textContent;
                    btnCopyJoinLink.textContent = 'Link Copiado! ✓';
                    setTimeout(() => {
                        btnCopyJoinLink.textContent = originalText;
                    }, 2000);
                }).catch(() => {
                    prompt('Copie o link abaixo:', activeJoinUrl);
                });
            } else {
                prompt('Copie o link abaixo:', activeJoinUrl);
            }
        });
    }

    if (sessionModalBackdrop) {
        sessionModalBackdrop.addEventListener('click', (e) => {
            if (e.target === sessionModalBackdrop) {
                closeModal(sessionModalBackdrop);
            }
        });
    }

    // Inicializa interface com dados carregados
    syncUI();
});
