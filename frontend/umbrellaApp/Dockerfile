# Imagem base oficial do Node.js LTS
FROM node:20-slim

# Instala dependências do sistema
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia manifestos de dependência
COPY package*.json ./

# Instala dependências (executa automaticamente o scripts/postinstall.js)
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Portas padrão do Expo e Metro Bundler
# 8081: Metro Bundler
# 19000: Expo DevTools / Server
EXPOSE 8081 19000 19001 19002

# Inicia o Expo com suporte a Web e rede local
ENV CI=1
CMD ["npx", "expo", "start", "--web", "--host", "lan"]
