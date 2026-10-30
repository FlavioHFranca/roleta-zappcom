FROM nginx:alpine

# Remove arquivos padrao do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos da aplicacao
COPY . /usr/share/nginx/html

# Copia configuracao otimizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expoe porta 80 do container
EXPOSE 80

# Inicia o servidor
CMD ["nginx", "-g", "daemon off;"]
