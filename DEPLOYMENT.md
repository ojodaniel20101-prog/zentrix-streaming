# Zentrix Streaming - Deployment Guide

## Prerequisites
- Node.js 18+ and pnpm
- MySQL/TiDB database
- Environment variables configured

## Database Setup

### 1. Create Database
```bash
mysql -u root -p
CREATE DATABASE zentrix_streaming CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Connection
Update `.env` with your database URL:
```
DATABASE_URL=mysql://user:password@host:3306/zentrix_streaming
```

### 3. Run Migrations
```bash
pnpm install
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Installation & Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Create `.env` file in project root with required values

### 3. Build Project
```bash
pnpm build
```

### 4. Start Server
```bash
pnpm start
```

Server will run on `http://localhost:3000`

## Database Persistence

The database connection is configured via the `DATABASE_URL` environment variable. When deployed:

1. **Local Development**: Uses local MySQL/TiDB instance
2. **Production**: Update `DATABASE_URL` to point to your production database
3. **Docker**: Mount `.env` file with production database URL
4. **Cloud Platforms** (Railway, Render, Vercel): Set environment variables in platform settings

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   └── lib/        # Utilities and tRPC client
│   └── public/         # Static assets
├── server/             # Express backend
│   ├── routers.ts      # tRPC procedures
│   ├── db.ts           # Database queries
│   └── _core/          # Core utilities
├── drizzle/            # Database schema & migrations
├── shared/             # Shared types and constants
└── package.json        # Dependencies
```

## Key Features

- ✅ Real-time user activity tracking
- ✅ Two-way admin-user feedback messaging
- ✅ Dynamic badge system
- ✅ Real-time analytics dashboard
- ✅ Manus OAuth authentication
- ✅ Full TypeScript type safety

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format: `mysql://user:password@host:port/database`
- Check database server is running
- Ensure user has proper permissions

### Build Errors
- Run `pnpm install` to ensure all dependencies are installed
- Clear cache: `rm -rf node_modules && pnpm install`

### Port Already in Use
- Change port in `server/_core/index.ts`
- Or kill existing process: `lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9`

## Support
For issues or questions, refer to the README.md in the project root.
