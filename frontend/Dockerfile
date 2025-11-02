# ---- Build Stage ----
# This stage builds the frontend application
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the source code and build the app
COPY frontend/ ./
RUN npm run build

# ---- Production Stage ----
# This stage serves the built static files using Nginx
FROM nginx:1.28-alpine

# Copy the built files from the 'builder' stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx configuration into the image, overwriting the default.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80