FROM node:20-alpine

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Install Angular CLI globally (important!)
RUN npm install -g @angular/cli

EXPOSE 4200

CMD ["npm", "start"]
