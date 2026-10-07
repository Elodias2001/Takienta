# Site de Takienta : statique, servi par nginx. Il n'y a rien d'autre à faire tourner :
# les paquets benin-geo sont des bibliothèques, ils ne sont pas dans l'image.

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

# Dépendances d'abord, pour que le cache tienne entre deux builds de contenu.
# Seul le paquet racine est installé : le site n'a besoin ni de tsup ni de TypeScript.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/js/package.json packages/js/package.json
RUN pnpm install --frozen-lockfile --filter .

COPY . .
RUN pnpm build:site && mv dist-site /out

FROM nginx:1.27-alpine AS runtime
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-securite.conf /etc/nginx/conf.d/securite.conf
COPY --from=build /out /usr/share/nginx/html
EXPOSE 8080
