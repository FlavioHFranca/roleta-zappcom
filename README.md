# 🎡 RoletaZapp - Roleta Personalizável de Nomes & Sorteios

Uma aplicação web moderna, fluida e interativa de sorteio estilo *Wheel of Names*, projetada com paleta **Azul Royal**, efeitos visuais em **Glassmorphism**, animação física suave a 60 FPS, efeitos sonoros sintetizados via Web Audio API e celebração de campeão com confetes.

Pronta para ser hospedada gratuitamente no **GitHub Pages** com zero configuração de build!

---

## ✨ Funcionalidades Principais

- 🎯 **Roleta Personalizável em Alta Definição (Canvas HiDPI)**:
  - Baseada no visual clássico da referência, com agulha indicadora dourada reativa no lado direito.
  - Desenho nítido em qualquer resolução (celular, tablet ou monitores 4K).
  - Alinhamento inteligente dos textos das fatias para comportar de 2 a dezenas de itens.

- ⚙️ **Controle de Tempo de Giro**:
  - Ajuste personalizado do tempo de rotação (de 1 a 20 segundos) com controle deslizante em tempo real.
  - Animação de desaceleração suave (*Quartic Out Easing*), proporcionando suspense autêntico de roleta real.

- 🏆 **Pop-up do Vencedor & Celebração de Campeão**:
  - Pop-up com cabeçalho vibrante e tipografia brilhante com o nome do sorteado.
  - Animação festiva de confetes e estrelas em tela cheia renderizados via canvas.
  - Fanfarra triunfante de vitória sintetizada por áudio.

- 🚫 **Opção de Desabilitar / Remover Vencedor**:
  - **Interruptor (Ligar/Desligar)**: Permite escolher se o vencedor é desabilitado/removido automaticamente da lista após o sorteio ou se permanece na roleta.
  - Botão manual de **Remover** no próprio modal do vencedor.
  - Registro de histórico na aba **Resultados** com botão para **Restaurar** qualquer nome de volta à roleta com 1 clique!

- 📝 **Gerenciamento Completo de Entradas**:
  - Adição rápida de itens por campo de texto.
  - Editor em área de texto livre (um nome/produto por linha com sincronização em tempo real).
  - Botão **🔀 Baralhar** (Shuffle com algoritmo Fisher-Yates).
  - Botão **🔤 Ordenar** (Ordem alfabética A-Z).
  - Botão **⚡ Exemplos** (Listas prontas: Nomes, Números 1 a 10, Prêmios e Brindes, Sim/Não, Dias da Semana).
  - Botão **🗑️ Limpar**.

- 🎨 **Personalização de Cores e Temas**:
  - Tonalidade padrão: **Azul Royal** com efeitos de profundidade e glassmorphism.
  - Seletor de temas de interface: *Azul Royal*, *Roxo Galáctico*, *Esmeralda*, *Cyberpunk* e *Pôr do Sol*.
  - Paletas de cores para as fatias da roleta: *Original (Foto)*, *Azul Royal*, *Vibrante*, *Sunset* e *Esmeralda*.

- 🔊 **Efeitos Sonoros Nativos (Web Audio API)**:
  - Estalo/tick mecânico a cada pino que passa pela agulha, desacelerando fielmente com a rotação.
  - Fanfarra triunfante na vitória.
  - Botão de mutar/desmutar som no cabeçalho.
  - Funciona totalmente offline, sem risco de falha no carregamento de arquivos de áudio externos.

- 📱 **Totalmente Responsivo**:
  - Otimizado para Smartphones, Tablets e Desktops.
  - Suporte a modo **Tela Cheia** para apresentações, lives e eventos.
  - Atalhos de teclado: Barra de espaço para girar, `ESC` para fechar modais.
  - Persistência automática no `localStorage` (seus nomes e preferências continuam salvos ao recarregar a página).

---

## 🚀 Como Hospedar no GitHub Pages (Passo a Passo)

Como o projeto é construído em HTML5, CSS3 e JavaScript puro, não é necessário instalar Node.js ou rodar comandos de compilação. Para colocá-lo no ar pelo GitHub:

1. **Crie um repositório no seu GitHub**:
   - Acesse [github.com/new](https://github.com/new).
   - Dê um nome ao repositório (exemplo: `roleta-sorteios` ou `roletazapp`).
   - Deixe como **Público** (*Public*).

2. **Envie os arquivos para o repositório**:
   ```bash
   git init
   git add .
   git commit -m "feat: RoletaZapp roleta personalizável"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
   git push -u origin main
   ```

3. **Ative o GitHub Pages**:
   - No seu repositório no GitHub, clique na aba **Settings** (Configurações).
   - No menu lateral esquerdo, clique em **Pages**.
   - Na seção **Build and deployment** > **Branch**:
     - Selecione a branch `main`.
     - Selecione a pasta `/ (root)`.
     - Clique em **Save**.
   - Pronto! Em 1 minuto o GitHub fornecerá o link público (exemplo: `https://seu-usuario.github.io/roleta-sorteios/`).

---

## 🐳 Como Executar com Docker (Acesso Mobile & Tablet)

O projeto inclui configuração pronta em **Docker** com servidor **Nginx Alpine** de alta performance, compressão gzip e cache otimizado para celulares e tablets na mesma rede Wi-Fi.

### 1. Iniciar o Container
Certifique-se de que o **Docker Desktop** esteja aberto e execute no terminal:
```bash
docker compose up -d --build
```

### 2. Acessar no Computador:
- Abra no navegador: `http://localhost:8080`

### 3. Acessar pelo Celular ou Tablet (Mesma rede Wi-Fi):
- Conecte o smartphone ou tablet na mesma rede Wi-Fi do computador.
- Abra o navegador do celular e digite o IP local da sua máquina:
  **`http://192.168.40.180:8080`**

### 4. Parar o Container:
```bash
docker compose down
```

---

## 💻 Como Executar Localmente (Sem Docker)

Para testar na sua própria máquina:

1. Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).
2. Ou use um servidor local simples:
   - Com Python:
     ```bash
     python -m http.server 8080
     ```
     Depois acesse `http://localhost:8080` no computador ou `http://192.168.40.180:8080` no celular.
   - Ou através da extensão **Live Server** do VS Code.

---

## 📂 Estrutura de Arquivos

```
roletazappcom/
│
├── index.html          # Estrutura semântica, acessibilidade e modais
├── css/
│   └── style.css       # Design System, Glassmorphism, Azul Royal e Responsividade
├── js/
│   ├── audio.js        # Sintetizador procedural de som (Web Audio API)
│   ├── confetti.js     # Sistema de partículas e confetes a 60 FPS
│   ├── wheel.js        # Motor físico da roleta e renderização Canvas HiDPI
│   └── app.js          # Controle de estado, entradas, modais e localStorage
├── assets/
│   └── favicon.svg     # Ícone em vetor da aplicação
└── README.md           # Documentação completa
```

---

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Semântica, Canvas 2D e Acessibilidade (ARIA).
- **CSS3 Puro**: Design System com CSS Custom Properties, Glassmorphism (`backdrop-filter`), Flexbox, CSS Grid e Animações Fluidas.
- **JavaScript (ES6+)**: Física de desaceleração suave, algoritmos de embaralhamento e ordenação.
- **Web Audio API**: Geração de som sintético procedural sem latência e sem dependências externas.
