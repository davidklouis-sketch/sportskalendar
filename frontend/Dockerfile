FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (include devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Accept environment variables for Vite at build time
ARG VITE_API_URL
ARG VITE_ADMOB_CLIENT_ID
ARG VITE_ADMOB_BANNER_SLOT
ARG VITE_ADMOB_SQUARE_SLOT
ARG VITE_ADMOB_LEADERBOARD_SLOT
ARG VITE_ADMOB_INTERSTITIAL_SLOT

# Set environment variables
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_ADMOB_CLIENT_ID=${VITE_ADMOB_CLIENT_ID}
ENV VITE_ADMOB_BANNER_SLOT=${VITE_ADMOB_BANNER_SLOT}
ENV VITE_ADMOB_SQUARE_SLOT=${VITE_ADMOB_SQUARE_SLOT}
ENV VITE_ADMOB_LEADERBOARD_SLOT=${VITE_ADMOB_LEADERBOARD_SLOT}
ENV VITE_ADMOB_INTERSTITIAL_SLOT=${VITE_ADMOB_INTERSTITIAL_SLOT}

# Show build args for debugging
RUN echo "Building with VITE_API_URL=${VITE_API_URL}" && \
    echo "AdMob Client ID: ${VITE_ADMOB_CLIENT_ID}"

# Build the application with timestamp to bust cache
RUN npx vite build --mode production

# Verify build output
RUN ls -la /app/dist && echo "Build completed, files created" && \
    echo "Checking for logo files:" && \
    ls -la /app/dist/logo* || echo "No logo files found" && \
    ls -la /app/dist/logos/ || echo "No logos directory found"

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Verify files were copied correctly in production stage
RUN echo "Verifying files in nginx html directory:" && \
    ls -la /usr/share/nginx/html/ && \
    echo "Checking for logo files:" && \
    ls -la /usr/share/nginx/html/logo* || echo "No logo files found" && \
    ls -la /usr/share/nginx/html/logos/ || echo "No logos directory found"

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
