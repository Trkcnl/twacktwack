# frontend/Dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Expose Vite's default port
EXPOSE 5173

# "--host" is vital! It allows access from outside the container
CMD ["npm", "run", "dev", "--", "--host"]