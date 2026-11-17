FROM node:20-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8081 19000 19001 19002

ENV CI=1
CMD ["npx", "expo", "start", "--web", "--host", "lan"]
