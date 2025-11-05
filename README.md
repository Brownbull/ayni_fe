# AYNI Frontend

React frontend for AYNI analytics platform.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Backend running on http://localhost:8000

### Setup

1. **Navigate to frontend:**
   ```bash
   cd C:/Projects/play/ayni_fe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access:**
   - Frontend: http://localhost:3000

## Project Structure

```
ayni_fe/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── lib/             # Utility functions
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   ├── api/             # API client functions
│   ├── store/           # Zustand stores
│   ├── test/            # Test utilities
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

## Development

### Running Tests

```bash
# Run tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Path Aliases

The following path aliases are configured:

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/pages/*` → `src/pages/*`
- `@/lib/*` → `src/lib/*`
- `@/hooks/*` → `src/hooks/*`
- `@/types/*` → `src/types/*`
- `@/api/*` → `src/api/*`
- `@/store/*` → `src/store/*`

Example:
```typescript
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
```

## Environment Variables

See `.env.example` for all available environment variables.

## Build

```bash
# Production build
npm run build

# Output will be in dist/
```

## Deployment

### Production Checklist

- [ ] Set `VITE_API_URL` to production backend
- [ ] Set `VITE_WS_URL` to production WebSocket
- [ ] Run `npm run build`
- [ ] Test production build with `npm run preview`
- [ ] Deploy `dist/` folder to hosting service
- [ ] Configure CORS on backend for production domain

## Tailwind Utilities

Custom component classes available:

- `.btn-primary` - Primary button styles
- `.btn-secondary` - Secondary button styles
- `.input` - Form input styles
- `.card` - Card container styles

## Port

- **Frontend:** 3000

## License

Proprietary - AYNI Platform
