# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Seed mock variables so build step doesn't fail on validation
ENV NEXT_PUBLIC_FIREBASE_API_KEY="mock-api-key-value-12345"
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ecoscore-mock.firebaseapp.com"
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID="ecoscore-mock"
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ecoscore-mock.appspot.com"
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
ENV NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef1234567890abcdef"
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-ABCDE12345"
ENV GEMINI_API_KEY="mock-gemini-key-value-54321"
ENV FIREBASE_PROJECT_ID="ecoscore-mock"
ENV FIREBASE_CLIENT_EMAIL="firebase-adminsdk-mock@ecoscore-mock.iam.gserviceaccount.com"
ENV FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----\n"


RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build when output: "standalone" is configured
CMD ["node", "server.js"]
