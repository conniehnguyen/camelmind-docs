# CamelMind self-hosting image
#
# Runtime env (pass via docker run -e or env_file — never bake secrets into the image):
#   CAMELMIND_URL              Public site URL (required for OIDC redirect URIs)
#   CAMELMIND_AUTH_ENABLED     "true" to enable auth
#   CAMELMIND_AUTH_REQUIRE_LOGIN, CAMELMIND_AUTH_PROVIDER, OIDC_*, SESSION_SECRET
#   See .env.example for the full list.
#
# Optional volume mounts to update docs without rebuilding:
#   docker run -v ./content:/app/content -v ./nav:/app/nav ...
#
# Full source is copied before npm install (no package.json-first layer) so this
# file works identically in the monorepo and in plain camelmind init projects.

FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV OFFLINE_MODE=

COPY . .

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Optional API Reference specs live here; mkdir keeps COPY working when unused.
RUN mkdir -p api

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Runtime-read data (not bundled by Next standalone file tracing)
COPY --from=builder --chown=nextjs:nodejs /app/content ./content
COPY --from=builder --chown=nextjs:nodejs /app/nav ./nav
COPY --from=builder --chown=nextjs:nodejs /app/versions.yml ./versions.yml
COPY --from=builder --chown=nextjs:nodejs /app/api ./api
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/home').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
