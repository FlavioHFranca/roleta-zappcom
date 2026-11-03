# Roleta Zappcom

Aplicação web para sorteios personalizáveis de nomes, produtos e itens em tempo real. Desenvolvida em JavaScript vanilla com renderização em HTML5 Canvas e efeitos de áudio sintetizados via Web Audio API, sem dependências externas.

---

## Recursos

- **Modo Sessão ao Vivo (Estilo Kahoot)**:
  - Criação de salas interativas com código PIN de 6 dígitos e QR Code vetorial em tempo real.
  - Tela mobile dedicada (`/join`) para os participantes entrarem direto pelo smartphone, escolhendo apelido e avatar em emoji.
  - Sincronização em tempo real via WebSockets: o apresentador gira a roleta no telão e os celulares dos participantes acompanham os estados de espera, rotação e resultado.
  - Celebração de vitória no celular do vencedor com compartilhamento instantâneo via WhatsApp e gerador integrado de cards para Instagram Stories (1080x1920).
- **Roleta em Canvas 2D**: Renderização dinâmica com suporte a telas de alta densidade (HiDPI/Retina), ponteiro indicador com deflexão física e divisão proporcional de fatias.
- **Foco em Apresentações**: Ocultação automática do painel lateral durante o giro da roleta para visão limpa dos participantes, com botão para alternar a exibição manualmente.
- **Duração Configurável**: Ajuste do tempo de giro (1 a 20 segundos) com desaceleração progressiva (easing quadrático).
- **Gerenciamento de Entradas**:
  - Adição unitária ou múltipla (separada por vírgula ou quebra de linha).
  - Embaralhamento aleatório (algoritmo Fisher-Yates).
  - Ordenação alfabética (A-Z).
  - Listas pré-definidas para testes rápidos.
- **Controle de Vencedores**:
  - Opção para desabilitar automaticamente o item sorteado após o resultado.
  - Histórico de resultados na aba dedicada, com opção de restauração para a roleta com um clique.
- **Áudio Sintetizado**: Feedback sonoro nativo via Web Audio API (som mecânico de rotação e sinal de vitória), sem necessidade de carregar arquivos externos.
- **Persistência Local**: Estado das entradas, resultados e preferências salvas automaticamente no `localStorage`.
- **Modo Tela Cheia e Atalhos**: Suporte ao modo tela cheia para projeções e atalhos de teclado (Barra de espaço para girar, `Esc` para fechar modais).

---

## Execução

### Opção 1: Via Docker (Recomendado)

O projeto possui configuração pronta com Docker Compose utilizando Node.js Alpine com suporte nativo a WebSockets e servidor HTTP na porta 8080.

1. Inicie o container:
   ```bash
   docker compose up -d --build
   ```

2. Acesse a aplicação:
   - Apresentador (Telão): `http://localhost:8080`
   - Participantes (Mobile): `http://<IP-DO-COMPUTADOR>:8080/join`

3. Para encerrar o serviço:
   ```bash
   docker compose down
   ```

### Opção 2: Servidor Node.js Local

Caso prefira executar sem Docker:

```bash
npm install
node server.js
```

---

## Estrutura do Projeto

```
roletazappcom/
├── css/
│   ├── style.css          # Estilos da interface principal do telão
│   └── join.css           # Estilos mobile-first da tela de entrada dos participantes
├── js/
│   ├── app.js             # Lógica de controle do telão, roleta e WebSocket Host
│   ├── join.js            # Lógica do participante, avatares, WebSocket e compartilhamento
│   ├── audio.js           # Geração de áudio procedural (Web Audio API)
│   ├── confetti.js        # Efeito de confetes no sorteio
│   └── wheel.js           # Motor de cálculo e renderização da roleta
├── assets/                # Imagens, logotipos e favicons
├── docker-compose.yml     # Orquestração do container Docker
├── Dockerfile             # Imagem base Node.js Alpine
├── package.json           # Dependências do backend WebSocket (ws, qrcode)
├── server.js              # Servidor HTTP e WebSocket com gestão de salas e QR Code
├── index.html             # Interface principal (Telão do Apresentador)
└── join.html              # Interface mobile do participante (/join)
```

---

## Atalhos de Teclado

| Tecla | Ação |
|---|---|
| `Espaço` | Gira a roleta (quando o cursor não estiver em campos de texto) |
| `Esc` | Fecha modais abertos |

---

## Tecnologias

- HTML5 (Canvas 2D, Semântica e Acessibilidade ARIA)
- CSS3 (CSS Grid, Flexbox, Custom Properties)
- JavaScript ES6+ (Vanilla no frontend)
- Web Audio API (Áudio sintetizado nativo)
- WebSockets (`ws`) para comunicação bidirecional em tempo real
- Node.js & Docker (Ambiente em container com sincronização de salas)
