# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — dependencies
#
# Installed in their own layer, keyed only on the lockfiles, so a source change
# does not reinstall. `npm ci` rather than `npm install`: it honours the lockfile
# exactly and fails if package.json and the lock have drifted, which is what you
# want in a build you cannot inspect.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# libc6-compat: some transitive native deps expect glibc symbols that Alpine's
# musl does not provide. Cheap insurance, and the standard Next.js recipe.
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./

# Retry/timeout tuning, not decoration. The default idle timeout is 5 minutes,
# which a slow or contended link exceeds mid-tarball — npm then aborts the whole
# install with EIDLETIMEOUT and the layer is lost. This has already happened once
# here, 30 minutes in, on a single package. Generous retries cost nothing on a
# fast network and are the difference between a build and a wasted half hour on a
# slow one.
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 600000 \
 && npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — build
#
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, not read
# at runtime. They must therefore arrive as build args: setting them as container
# environment variables later has no effect whatsoever, which is a common and
# very confusing deployment failure.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
ARG NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
ARG BASEPATH=""

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=$NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY \
    NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=$NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT \
    BASEPATH=$BASEPATH \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The build type-checks. next.config.ts sets eslint.ignoreDuringBuilds but
# deliberately does NOT set typescript.ignoreBuildErrors, so a type error fails
# the image rather than shipping code the compiler objects to.
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — runtime
#
# Copies only the standalone server plus the static assets it serves. `.next/static`
# and `public/` are NOT included in the standalone output and must be copied
# separately — omitting them yields a site that boots fine and renders with no CSS
# or images, which looks like a styling bug rather than a packaging one.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# HOSTNAME=0.0.0.0 above is load-bearing: the standalone server binds 127.0.0.1
# by default, which is unreachable from outside the container and presents as a
# health check that never passes.
CMD ["node", "server.js"]
