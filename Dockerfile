# Base image
FROM node:20-alpine

# Dossier de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances (dev + prod)
RUN npm install

# Installer Nest CLI globalement pour pouvoir utiliser "nest start --watch"
RUN npm install -g @nestjs/cli

# Copier tout le code source
COPY . .

# Exposer le port de Nest
EXPOSE 3000

# Lancer Nest en mode dev avec watch
CMD ["npm", "run", "start:dev"]
