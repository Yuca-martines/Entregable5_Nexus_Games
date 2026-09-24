# ==============================================================================
# DOCKERFILE - FRONTEND NEXUS GAMES (React 19 + Vite + Nginx)
# ==============================================================================

# ------------------------------------------------------------------------------
# Etapa 1: Construcción (Build)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Argumento de compilación para la URL de la API (opcional en build time)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias limpiamente
RUN npm ci --prefer-offline --no-audit

# Copiar el código fuente completo
COPY . .

# Compilar la aplicación para producción
RUN npm run build

# ------------------------------------------------------------------------------
# Etapa 2: Servidor Nginx Ligero para Producción
# ------------------------------------------------------------------------------
FROM nginx:alpine

# Puerto dinámico por defecto (Railway inyectará su propio $PORT)
ENV PORT=80

# Copiar el template de configuración de Nginx (sustituye ${PORT} automáticamente al iniciar)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copiar los archivos estáticos compilados desde la etapa de builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Nginx iniciará automáticamente sustituyendo las variables en el template
CMD ["nginx", "-g", "daemon off;"]
