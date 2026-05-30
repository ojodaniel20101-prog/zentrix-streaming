# Zentrix Streaming 🎬

A full-stack streaming platform built with React 19, Express, tRPC, and MySQL. Watch movies, TV shows, anime, and live channels — with a real-time admin dashboard, badge system, and user analytics.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, Shadcn/UI, Framer Motion |
| Backend | Express 4, tRPC 11, TypeScript |
| Database | MySQL (Drizzle ORM) |
| Auth | JWT |
| Build | Vite 7, esbuild, pnpm |
| Deploy | Vercel + Railway MySQL |

---

## Features

- 🎥 Stream movies, TV shows, anime & live channels
- 📊 Real-time analytics dashboard
- 🏅 Dynamic badge & rewards system
- 💬 Two-way admin-user feedback messaging
- 👤 User profiles & watchlists
- 🌙 Dark/light theme
- 📱 Mobile responsive

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- MySQL database

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/zentrix-streaming.git
cd zentrix-streaming
pnpm install
```

### 2. Configure Environment
Create a `.env` file in the root:
```env
DATABASE_URL=mysql://user:password@host:3306/zentrix_streaming
JWT_SECRET=your_secret_here
NODE_ENV=development
```

### 3. Run Migrations
```bash
pnpm db:push
```

### 4. Start Dev Server
```bash
pnpm dev
```

App runs at `http://localhost:3000`

---

## Deployment

### Vercel + Railway (Recommended)

1. Push repo to GitHub
2. Create a MySQL database on [Railway](https://railway.app)
3. Copy the `MYSQL_PUBLIC_URL` from Railway Variables
4. Import repo on [Vercel](https://vercel.com)
5. Add environment variables in Vercel project settings:
   - `DATABASE_URL` → paste Railway URL
   - `JWT_SECRET` → any random secret string
   - `NODE_ENV` → `production`
6. Deploy!

### Docker
```bash
docker-compose up --build
```

---

## Project Structure

```
├── client/               # React frontend
│   └── src/
│       ├── pages/        # Page components
│       ├── components/   # Reusable UI
│       ├── contexts/     # React contexts
│       ├── hooks/        # Custom hooks
│       └── lib/          # tRPC client & utils
├── server/               # Express backend
│   ├── routers.ts        # tRPC procedures
│   ├── db.ts             # Database queries
│   └── _core/            # Auth, middleware, proxies
├── drizzle/              # Schema & migrations
├── shared/               # Shared types & constants
├── vercel.json           # Vercel config
└── docker-compose.yml    # Docker config
```

---

## Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm db:push    # Generate & run migrations
pnpm test       # Run tests
```

---

## License

MIT
