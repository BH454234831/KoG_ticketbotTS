FROM node:22 as builder
WORKDIR /build
COPY . .
RUN npm install --production

FROM node:22
WORKDIR /app
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/src ./src
COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/tsconfig.json ./tsconfig.json
COPY --from=builder /build/.env ./.env

CMD ["npm", "start"]
