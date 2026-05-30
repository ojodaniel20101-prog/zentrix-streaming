# Quick Start Guide

## 1. Extract and Navigate
```bash
unzip zentrix-streaming-deployment.zip
cd zentrix-streaming
```

## 2. Install Dependencies
```bash
pnpm install
```

## 3. Configure Database
Create `.env` file in project root with your database connection and other environment variables

## 4. Run Migrations
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## 5. Start Development Server
```bash
pnpm dev
```

## 6. Build for Production
```bash
pnpm build
pnpm start
```

The application will be available at `http://localhost:3000`
