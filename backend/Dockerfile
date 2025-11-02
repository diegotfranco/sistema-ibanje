# ---- Builder Stage ----
# This stage installs all dependencies (including dev) and builds the TypeScript code.
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install all dependencies
# Using 'npm ci' is faster and more reliable for CI/CD environments
COPY package*.json ./
RUN npm ci

# Copy the rest of your application source code
COPY . .

# Run the build script from your package.json
# This will create the 'dist' folder with the compiled JavaScript
RUN npm run build


# ---- Production Stage ----
# This stage creates the final, lightweight image with only what's needed to run the app.
FROM node:24-alpine

# Set the environment to production
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files with correct ownership
COPY --chown=appuser:appgroup package*.json ./

# Install ONLY production dependencies and remove the npm cache
RUN npm install --omit=dev && npm cache clean --force

# Switch to the non-root user for the rest of the build
USER appuser

# Copy the rest of the application files with correct ownership
COPY --chown=appuser:appgroup database.json ./
COPY --chown=appuser:appgroup --from=builder /usr/src/app/dist ./dist
COPY --chown=appuser:appgroup migrations ./migrations

EXPOSE 5000

# The command to start your app, using the 'start' script from package.json
CMD [ "npm", "start" ]