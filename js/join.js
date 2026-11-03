// ==========================================================================
// Roleta Zappcom - Script Mobile do Participante (Estilo Kahoot.it)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Elementos da Interface
    const viewEntry = document.getElementById('view-entry');
    const viewLobby = document.getElementById('view-lobby');
    const viewSpinning = document.getElementById('view-spinning');
    const viewWinner = document.getElementById('view-winner');
    const viewOtherWinner = document.getElementById('view-other-winner');

    const formJoin = document.getElementById('form-join');
    const inputPin = document.getElementById('input-pin');
    const inputName = document.getElementById('input-name');
    const emojiGrid = document.getElementById('emoji-grid');
    const joinError = document.getElementById('join-error');
    const btnEnter = document.getElementById('btn-enter');

    const statusDotContainer = document.getElementById('connection-status');
    const statusText = document.getElementById('status-text');

    const lobbyAvatar = document.getElementById('lobby-avatar');
    const lobbyName = document.getElementById('lobby-name');
    const lobbyPin = document.getElementById('lobby-pin');

    const spinPlayerAvatar = document.getElementById('spin-player-avatar');

    const winnerCelebrateName = document.getElementById('winner-celebrate-name');
    const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
    const btnShareStory = document.getElementById('btn-share-story');
    const btnCopyLink = document.getElementById('btn-copy-link');

    const otherWinnerEmoji = document.getElementById('other-winner-emoji');
    const otherWinnerName = document.getElementById('other-winner-name');

    const canvasStory = document.getElementById('canvas-story');

    // Lista de Emojis para o Avatar
    const AVATAR_EMOJIS = [
        '🚀', '🦁', '🦊', '⚡', '🎯', '💎',
        '🍕', '🎮', '🦄', '🏆', '🔥', '👑',
        '🐱', '🤖', '🎸', '🏀', '🌟', '🍀'
    ];

    let selectedEmoji = '🚀';
    let myPlayer = null;
    let currentRoomPin = '';
    let ws = null;

    // 1. Inicialização do Seletor de Emojis
    emojiGrid.innerHTML = '';
    AVATAR_EMOJIS.forEach((emoji, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `emoji-btn ${index === 0 ? 'selected' : ''}`;
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedEmoji = emoji;
        });
        emojiGrid.appendChild(btn);
    });

    // 2. Preenchimento Automático do PIN pela URL (?pin=123456)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pin')) {
        const rawPin = urlParams.get('pin').replace(/\D/g, '').substring(0, 6);
        inputPin.value = rawPin;
        if (rawPin.length === 6) {
            inputName.focus();
        }
    }

    // Formatação do PIN no input
    inputPin.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
    });

    // 3. Controle de Telas (Views)
    function switchView(targetView) {
        [viewEntry, viewLobby, viewSpinning, viewWinner, viewOtherWinner].forEach(v => {
            v.classList.remove('active');
        });
        targetView.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 4. Conexão WebSocket com Reconexão Automática
    function connectWS() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        statusText.textContent = 'Conectando...';
        statusDotContainer.className = 'connection-status';

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            statusText.textContent = 'Online';
            statusDotContainer.className = 'connection-status online';
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            } catch (err) {
                console.error('Erro ao processar mensagem do servidor:', err);
            }
        };

        ws.onclose = () => {
            statusText.textContent = 'Offline';
            statusDotContainer.className = 'connection-status offline';
            // Tenta reconectar em 3 segundos se estiver fora
            setTimeout(() => {
                if (!ws || ws.readyState === WebSocket.CLOSED) {
                    connectWS();
                }
            }, 3000);
        };

        ws.onerror = () => {
            statusText.textContent = 'Erro';
            statusDotContainer.className = 'connection-status offline';
        };
    }

    connectWS();

    // 5. Envio do Formulário de Entrada
    formJoin.addEventListener('submit', (e) => {
        e.preventDefault();
        joinError.style.display = 'none';

        const pin = inputPin.value.trim();
        const name = inputName.value.trim();

        if (pin.length !== 6) {
            showError('O código PIN deve conter 6 dígitos.');
            inputPin.focus();
            return;
        }

        if (!name) {
            showError('Por favor, informe seu nome ou apelido.');
            inputName.focus();
            return;
        }

        if (!ws || ws.readyState !== WebSocket.OPEN) {
            showError('Sem conexão com o servidor. Aguarde um momento...');
            return;
        }

        btnEnter.disabled = true;
        btnEnter.textContent = 'ENTRANDO...';

        ws.send(JSON.stringify({
            type: 'player:join',
            pin,
            name,
            emoji: selectedEmoji
        }));
    });

    function showError(msg) {
        joinError.textContent = msg;
        joinError.style.display = 'block';
        btnEnter.disabled = false;
        btnEnter.textContent = 'ENTRAR NO TELÃO';
    }

    // 6. Tratamento de Mensagens do Servidor
    function handleServerMessage(data) {
        switch (data.type) {
            case 'player:joined_success':
                myPlayer = data.player;
                currentRoomPin = data.roomPin;

                lobbyAvatar.textContent = myPlayer.emoji;
                lobbyName.textContent = myPlayer.name;
                lobbyPin.textContent = `${currentRoomPin.substring(0, 3)} ${currentRoomPin.substring(3)}`;
                spinPlayerAvatar.textContent = myPlayer.emoji;

                switchView(viewLobby);
                break;

            case 'player:join_error':
                showError(data.message);
                break;

            case 'game:spinning':
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
                switchView(viewSpinning);
                break;

            case 'game:you_won':
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200, 100, 400]);
                }
                winnerCelebrateName.textContent = `${myPlayer.emoji} ${myPlayer.name}`;
                switchView(viewWinner);
                break;

            case 'game:winner_announced':
                const winner = data.winner;
                otherWinnerEmoji.textContent = winner.emoji || '🏆';
                otherWinnerName.textContent = winner.name || 'Ganhador';
                switchView(viewOtherWinner);
                break;

            case 'player:removed':
            case 'game:session_ended':
                alert(data.message || data.reason || 'Sessão encerrada.');
                btnEnter.disabled = false;
                btnEnter.textContent = 'ENTRAR NO TELÃO';
                switchView(viewEntry);
                break;
        }
    }

    // 7. Compartilhamento Social da Vitória

    // WhatsApp
    btnShareWhatsapp.addEventListener('click', () => {
        if (!myPlayer) return;
        const msg = `🎉 Fui o grande vencedor do sorteio na Roleta Zappcom! 🏆\n\n${myPlayer.emoji} *${myPlayer.name}*\n\nConheça a Zappcom Soluções em TI!`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    });

    // Copiar Texto
    btnCopyLink.addEventListener('click', () => {
        if (!myPlayer) return;
        const msg = `🎉 Fui o grande vencedor do sorteio na Roleta Zappcom! 🏆\n${myPlayer.emoji} ${myPlayer.name}\nZappcom Soluções em TI`;
        navigator.clipboard.writeText(msg).then(() => {
            const original = btnCopyLink.innerHTML;
            btnCopyLink.innerHTML = `<span>✓ Copiado com sucesso!</span>`;
            setTimeout(() => { btnCopyLink.innerHTML = original; }, 2500);
        }).catch(() => {
            alert('Texto copiado!');
        });
    });

    // Gerador de Card para Instagram Stories (1080 x 1920 px)
    btnShareStory.addEventListener('click', () => {
        if (!myPlayer) return;
        generateInstagramStory(myPlayer);
    });

    function generateInstagramStory(player) {
        const ctx = canvasStory.getContext('2d');
        const W = 1080;
        const H = 1920;

        // Fundo Sólido Elegante
        ctx.fillStyle = '#0f1115';
        ctx.fillRect(0, 0, W, H);

        // Moldura sutil interna
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 12;
        ctx.strokeRect(60, 60, W - 120, H - 120);

        // Header: ZAPPCOM
        ctx.fillStyle = '#2563eb';
        ctx.font = '800 48px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ZAPPCOM SOLUÇÕES EM TI', W / 2, 280);

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('SORTEIO AO VIVO', W / 2, 340);

        // Ícone Troféu Central
        ctx.font = '190px serif';
        ctx.fillText('🏆', W / 2, 680);

        // Selo de Vencedor
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(W / 2 - 220, 780, 440, 70, 35);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = '800 36px "Outfit", sans-serif';
        ctx.fillText('GRANDE VENCEDOR', W / 2, 828);

        // Avatar Emoji do Participante
        ctx.font = '150px serif';
        ctx.fillText(player.emoji, W / 2, 1080);

        // Nome do Participante em Destaque
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 84px "Outfit", sans-serif';
        ctx.fillText(player.name, W / 2, 1220);

        // Data do sorteio
        const dataStr = new Date().toLocaleDateString('pt-BR');
        ctx.fillStyle = '#71717a';
        ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`Sorteado em ${dataStr}`, W / 2, 1310);

        // Card Inferior de Chamada
        ctx.fillStyle = '#181a1f';
        ctx.beginPath();
        ctx.roundRect(140, 1500, W - 280, 200, 24);
        ctx.fill();

        ctx.strokeStyle = '#2d303a';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#f4f4f5';
        ctx.font = '700 40px "Outfit", sans-serif';
        ctx.fillText('Roleta Zappcom', W / 2, 1585);

        ctx.fillStyle = '#2563eb';
        ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('@zappcomti', W / 2, 1640);

        // Compartilha via Web Share API se suportado com arquivo, senão faz Download
        canvasStory.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'vitoria-roleta-zappcom.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    files: [file],
                    title: 'Vitória na Roleta Zappcom!',
                    text: 'Fui o sorteado na Roleta Zappcom!'
                }).catch(err => {
                    console.log('Compartilhamento cancelado ou não suportado:', err);
                });
            } else {
                // Fallback: Baixa imagem automaticamente para salvar nos Stories
                const link = document.createElement('a');
                link.download = 'vitoria-roleta-zappcom.png';
                link.href = URL.createObjectURL(blob);
                link.click();
                alert('Card do Instagram gerado e baixado! Agora basta postar no seu Story.');
            }
        }, 'image/png');
    }
});
