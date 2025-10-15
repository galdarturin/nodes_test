FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --only=production

COPY . .

EXPOSE 3520

CMD ["npm", "start"]
