FROM node:20-alpine

WORKDIR /app

# Instala dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia código da aplicação
COPY . .

# Expõe a porta do servidor
EXPOSE 8080
ENV PORT=8080

# Inicia o servidor HTTP + WebSocket
CMD ["node", "server.js"]
