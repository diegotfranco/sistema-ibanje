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

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set ownership of the app directory
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

WORKDIR /usr/src/app

# Copy package files again
COPY package*.json ./

# Copy migration configuration
COPY database.json ./

# Install ONLY production dependencies and remove the npm cache
RUN npm install --omit=dev && npm cache clean --force

# Copy the compiled code from the 'builder' stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy migrations
COPY migrations ./migrations

# Expose the port your Express app runs on (e.g., 5000)
# Make sure this matches the port in your application code
EXPOSE 5000

# The command to start your app, using the 'start' script from package.json
CMD [ "npm", "start" ]