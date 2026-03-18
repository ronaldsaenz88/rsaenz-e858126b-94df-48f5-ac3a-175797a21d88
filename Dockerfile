FROM node:current-alpine

WORKDIR /apps

COPY eslint*.mjs ./
COPY jest*.ts ./
COPY jest*.js ./
COPY nx*.json ./
COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install -g nx
RUN npm install

COPY . .

CMD ["npm", "run", "start"]
