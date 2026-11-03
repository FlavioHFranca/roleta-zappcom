# Roleta Zappcom

Aplicação web para sorteios personalizáveis de nomes, produtos e itens em tempo real. Desenvolvida em JavaScript vanilla com renderização em HTML5 Canvas e efeitos de áudio sintetizados via Web Audio API, sem dependências externas.

---

## Recursos

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

O projeto possui configuração pronta com Docker Compose utilizando Nginx Alpine para servir os arquivos estáticos na porta 8080.

1. Inicie o container:
   ```bash
   docker compose up -d --build
   ```

2. Acesse a aplicação:
   - No computador: `http://localhost:8080`
   - Em dispositivos na mesma rede local: `http://<IP-DO-COMPUTADOR>:8080`

3. Para encerrar o serviço:
   ```bash
   docker compose down
   ```

### Opção 2: Servidor HTTP Local

Caso não utilize Docker, execute com qualquer servidor estático:

- **Python**:
  ```bash
  python -m http.server 8080
  ```

- **Node.js (npx)**:
  ```bash
  npx serve . -p 8080
  ```

- Ou abra diretamente o arquivo `index.html` em um navegador.

---

## Estrutura do Projeto

```
roletazappcom/
├── css/
│   └── style.css          # Estilos da interface e temas
├── js/
│   ├── app.js             # Lógica de controle, eventos e persistência
│   ├── audio.js           # Geração de áudio procedural (Web Audio API)
│   ├── confetti.js        # Efeito de confetes no sorteio
│   └── wheel.js           # Motor de cálculo e renderização da roleta
├── assets/                # Imagens, logotipos e favicons
├── docker-compose.yml     # Orquestração do container Docker
├── Dockerfile             # Imagem base Nginx Alpine
├── nginx.conf             # Configuração do servidor web
├── iniciar.bat            # Script de inicialização rápida no Windows
└── index.html             # Marcação principal da aplicação
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
- JavaScript ES6+ (Vanilla / Sem dependências externas)
- Web Audio API (Áudio sintetizado nativo)
- Docker & Nginx Alpine
