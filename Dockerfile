FROM node:20.17.0 as base

FROM base AS deps


WORKDIR /app

COPY package.json  package-lock.json ./

RUN yarn config set registry 'https://registry.npmmirror.com/'
RUN npm install

COPY . .

RUN npm run build


FROM nginx:alpine

WORKDIR /app
COPY --from=deps /app/dist/ /usr/share/nginx/html

EXPOSE 80

# 默认启动nginx
CMD ["nginx", "-g", "daemon off;"]
