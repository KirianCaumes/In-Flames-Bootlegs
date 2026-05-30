FROM node:24.15.0-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Create non-root user for security
RUN useradd -m -u 10001 usr
RUN chown usr:usr /app

COPY --chown=usr:usr . .

RUN npm run build

USER usr

EXPOSE 3000

CMD ["npm", "run", "start"]