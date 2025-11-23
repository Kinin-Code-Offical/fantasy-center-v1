# --- STAGE 1: Dependencies ---
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Paket dosyalarını kopyala
COPY package.json package-lock.json ./

# Temiz kurulum yap (npm ci, npm install'dan daha güvenilirdir)
RUN npm ci

# --- STAGE 2: Builder ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma Client'ı oluştur (Build almadan önce bu ŞARTTIR)
# Not: Schema dosyanın var olduğunu varsayar, yoksa hata verir.
# O yüzden önce 'npx prisma init' yapmış olmalısın.
RUN npx prisma generate

# Next.js Build al
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# --- STAGE 3: Runner (Production Image) ---
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Güvenlik: Root kullanıcısı yerine nodejs kullanıcısı oluştur
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Sadece gerekli dosyaları builder'dan al
COPY --from=builder /app/public ./public

# İzinleri ayarla ve standalone çıktıyı kopyala
# .next/standalone klasörü Next.js build işlemiyle otomatik oluşur
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Kullanıcıyı değiştir
USER nextjs

# Port ayarları (Cloud Run varsayılan olarak 8080 bekler ama biz 3000 vereceğiz)
EXPOSE 3000
ENV PORT 3000
# Cloud Run için Hostname'i 0.0.0.0 yapmak zorunludur
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]