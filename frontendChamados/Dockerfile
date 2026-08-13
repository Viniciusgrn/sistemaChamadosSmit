# SPA compilada e servida pelo nginx, que também é o proxy do Django.
#
# Front e API saem da MESMA origem em produção: o cookie de sessão e o csrftoken
# passam a ser same-site, sem CORS no meio. Por isso VITE_API_URL é só "/api".
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
# npm ci exige o lock; sem ele (repo ainda não versionou) cai no install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

# Vite injeta isto no bundle no momento do build — não é lido em runtime.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# O default.conf entra por bind mount (deploy/nginx/), não copiado pra imagem:
# ajustar domínio, TLS ou timeout não deve exigir rebuild do bundle.

EXPOSE 80
