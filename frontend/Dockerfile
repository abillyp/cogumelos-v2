FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --quiet
COPY . .
RUN mkdir -p public
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S cogumelos && adduser -S cogumelos -G cogumelos
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER cogumelos
EXPOSE 3000
CMD ["node", "server.js"]
