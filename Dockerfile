FROM node:23.11-bookworm-slim AS builder
WORKDIR /app/
COPY package.json package-lock.json /app/
RUN npm install
COPY . /app/
RUN npm run build

FROM nginx:1.27-bookworm
ENV NGINX_PORT=8080
ENV NGINX_HOSTNAME=localhost
COPY --from=builder /app/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist/index.html /app/dist/styles.css /app/dist/app.js /var/www/html/
