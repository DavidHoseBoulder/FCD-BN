# Use a Node.js base image
FROM node:lts as builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Use a smaller image for production
FROM node:slim

# Set working directory
WORKDIR /app

# Copy build output from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next/server ./.next/server
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Set the environment variable for credentials
ENV GOOGLE_APPLICATION_CREDENTIALS_JSON="/app/secrets.json"

# Expose the port your Next.js app runs on
EXPOSE 8080

# Command to run your Next.js application in production mode
CMD ["node", ".next/server/run.js"]