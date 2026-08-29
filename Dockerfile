# Stage 1: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 版本信息（由 CI 通过 build-arg 注入，本地构建时回退为 dev）
ARG APP_VERSION=dev
ARG GIT_SHA=""
ENV NEXT_PUBLIC_APP_VERSION=${APP_VERSION}
ENV NEXT_PUBLIC_GIT_SHA=${GIT_SHA}

# 复制 package 文件和 Prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# 安装所有依赖
RUN npm ci && \
    npm cache clean --force

# 复制剩余源代码
COPY . .

# 构建
# SKIP_OPEN_NEXT_BUILD：Docker 只需要 Next standalone 产物，
# postbuild 钩子的 OpenNext（Cloudflare Workers）打包在此属双倍构建时间
ENV SKIP_OPEN_NEXT_BUILD=1
RUN npm run build


# Stage 2: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV="production"
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

# 运行时服务端通过 process.env 读取版本（与构建期内联值同源）
ARG APP_VERSION=dev
ARG GIT_SHA=""
ENV NEXT_PUBLIC_APP_VERSION=${APP_VERSION}
ENV NEXT_PUBLIC_GIT_SHA=${GIT_SHA}

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
# seed 脚本经 tsx 直接执行，依赖 lib/prisma.ts 源文件与 tsconfig 路径别名
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# 复制运行时依赖（数据库初始化和 seed 脚本需要）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制启动脚本
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# 会话密钥兜底文件目录（entrypoint.sh 未配置 SESSION_SECRET 时生成并持久化）：
# /app 属 root 而进程以 nextjs 运行，必须预建可写目录，否则重启重新生成密钥、全部会话失效
RUN mkdir -p /app/.session-data && chown -R nextjs:nodejs /app/.session-data
ENV SESSION_SECRET_FILE=/app/.session-data/.session-secret

# 切换到非 root 用户
USER nextjs

EXPOSE 3000

# 执行启动脚本
CMD ["sh", "/app/entrypoint.sh"]
