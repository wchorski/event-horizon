## Dockerfile
## https://docs.astro.build/en/recipes/docker/#multi-stage-build-using-ssr
FROM node:lts-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json package-lock.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS prod-deps
RUN pnpm install --prod --frozen-lockfile


FROM base AS build-deps
RUN pnpm install --frozen-lockfile



FROM build-deps AS build
COPY . .
RUN pnpm run build;


# Migration stage (has access to drizzle-kit)
FROM build-deps AS migrate
COPY . .
# COPY --from=build /app/dist ./dist
CMD ["npx", "drizzle-kit", "migrate"]

# Seed stage
FROM build-deps AS seed
COPY . .
CMD ["sh", "-c", "if [ -f pnpm-lock.yaml ]; then pnpm run db:seed:truncate; else npm run db:seed:truncate; fi"]


FROM base AS runtime
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/db ./db

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
# CMD ["npm", "run", "start"]