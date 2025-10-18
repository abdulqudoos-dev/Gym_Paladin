# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build-time envs and expose them to Next.js build
ARG NEXT_PUBLIC_BACKEND_URL
ARG BACKEND_URL
ARG GOOGLE_REDIRECT_URI
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL \
    BACKEND_URL=$BACKEND_URL \
    GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI

# Build Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Keep runtime envs available for server-side code if needed
ARG NEXT_PUBLIC_BACKEND_URL
ARG BACKEND_URL
ARG GOOGLE_REDIRECT_URI
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL \
    BACKEND_URL=$BACKEND_URL \
    GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 4562

ENV PORT=4562
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

