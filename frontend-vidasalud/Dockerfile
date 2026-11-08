# Build de la aplicación Angular
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias del proyecto
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación para producción
RUN npm run build -- --configuration=production


# Servidor Web Nginx para Producción
# ============================================
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados desde la etapa de build
# Nota: Ajusta la ruta 'dist/frontend-vidasalud/browser' si tu nombre de salida en angular.json difiere
COPY --from=build /app/dist/frontend-vidasalud/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]