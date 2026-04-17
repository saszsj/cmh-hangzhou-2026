## QR → AI Demo Generator

扫码进入表单，提交「我叫 / 行业 / 头疼问题」，系统生成一个可分享的解决方案 Demo 页面：

- **入口**: `/new`
- **结果页**: `/<slug>`（默认取“姓名拼音首字母”，冲突自动加数字）
- **二维码**: `/api/qr?target=/new`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment variables

Create `.env.local`:

```bash
DATABASE_URL="postgres://..."
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4.1-mini"
```

If `OPENAI_API_KEY` is not set, the app will fall back to a placeholder spec (still stores to DB).

### Database (Neon / Postgres)

- Generate migrations: `npm run db:generate`
- Apply migrations (requires `DATABASE_URL`): `npm run db:migrate`

## Deploy on Vercel

1. Create a Vercel project from this repo.
2. Set env vars in Vercel:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional)
3. Run DB migrations once (from your machine or CI) against the Neon database:

```bash
DATABASE_URL="..." npm run db:migrate
```

### Custom domain

In Vercel → Project → Settings → Domains:

- Add `cmh.zsj.fr`
- Follow Vercel’s DNS instructions (typically a CNAME from `cmh` to Vercel)

## Notes

- The app **does not execute AI-generated arbitrary code**. It generates **validated JSON** and renders via a fixed set of widgets.
