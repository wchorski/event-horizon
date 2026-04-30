## https://docs.astro.build/en/recipes/docker/#multi-stage-build-using-ssr
FROM node:lts-slim AS base
WORKDIR /app

RUN corepack enable

# By copying only the package.json and package-lock.json here, we ensure that the following `-deps` steps are independent of the source code.
# Therefore, the `-deps` steps will be skipped if only the source code changes.
COPY package.json package-lock.json pnpm-lock.yaml ./

FROM base AS prod-deps
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --prod --frozen-lockfile; \
    else \
      npm install --omit=dev; \
    fi


FROM base AS build-deps
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      npm install; \
    fi


FROM build-deps AS build
COPY . .
RUN npm run build

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