# Client image: builds the static app and serves it with nginx, proxying /api to the API container.
FROM node:22-slim AS build
WORKDIR /app
# Where the browser finds the API. Baked into the build: "/api/v1" (same site, proxied by nginx) or a full URL.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
