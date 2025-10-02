FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript)
RUN npm install

# Install missing dependencies explicitly
RUN npm install pg xml2js otplib qrcode
RUN npm install --save-dev @types/pg @types/xml2js @types/qrcode

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 4000

# Start the application directly with ts-node (bypass TypeScript compilation)
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]

