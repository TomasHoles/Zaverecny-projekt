# Dockerfile pro React frontend
FROM node:20-alpine

# Pracovní adresář
WORKDIR /app

# Kopírování package.json a package-lock.json
COPY package*.json ./

# Instalace závislostí
RUN npm install

# Kopírování zdrojového kódu
COPY . .

# Exponování portu
EXPOSE 3000

# Spuštění development serveru
CMD ["npm", "start"]
