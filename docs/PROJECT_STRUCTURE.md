# Project Structure

This document explains the organization and purpose of each directory and key file in the Sales Intelligence Briefing project.

## 📁 Root Directory

```
sales-intelligence-briefing/
├── frontend/           # React + TypeScript web application
├── backend/            # Express.js API server with IBM watsonx.ai integration
├── docs/              # Project documentation
├── .gitignore         # Git ignore rules
├── LICENSE            # MIT License
└── README.md          # Main project documentation
```

## 🎨 Frontend (`/frontend`)

The React-based user interface for generating sales briefings.

```
frontend/
├── src/
│   ├── pages/              # Main application pages
│   │   ├── BriefingPage.tsx       # Main briefing generation page with PDF export
│   │   ├── ArchitecturePage.tsx   # System architecture documentation
│   │   └── not-found.tsx          # 404 error page
│   ├── components/
│   │   └── ui/                    # Reusable UI components (shadcn/ui)
│   ├── hooks/                     # Custom React hooks
│   ├── lib/
│   │   └── utils.ts               # Utility functions
│   ├── App.tsx                    # Main app component with routing
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
├── public/                        # Static assets
│   ├── avatar.jpeg               # Default profile image
│   ├── favicon.svg               # Site favicon
│   ├── opengraph.jpg             # Social media preview image
│   └── robots.txt                # Search engine instructions
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
└── components.json                # shadcn/ui configuration
```

### Key Frontend Files

- **`BriefingPage.tsx`**: Core application logic
  - Contact information form
  - AI-powered briefing generation
  - PDF export with jsPDF
  - Image proxy integration for CORS-free images

- **`ArchitecturePage.tsx`**: Interactive system architecture diagram

- **`components/ui/`**: 50+ reusable UI components from shadcn/ui
  - Forms, buttons, dialogs, cards, etc.
  - Fully typed with TypeScript
  - Customizable with Tailwind CSS

## ⚙️ Backend (`/backend`)

Express.js API server that integrates with IBM watsonx.ai for AI-powered briefing generation.

```
backend/
├── src/
│   ├── routes/                    # API route handlers
│   │   ├── index.ts              # Route aggregator
│   │   ├── briefing.ts           # Main briefing generation endpoint
│   │   └── health.ts             # Health check endpoint
│   ├── middlewares/               # Express middlewares
│   │   └── .gitkeep
│   ├── lib/                       # Shared utilities
│   │   └── logger.ts             # Winston logger configuration
│   ├── app.ts                     # Express app configuration
│   └── index.ts                   # Server entry point
├── .env.example                   # Environment variables template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── build.mjs                      # Build script
```

### Key Backend Files

- **`routes/briefing.ts`**: Main API endpoint
  - `/api/briefing` - POST endpoint for generating briefings
  - Integrates with IBM watsonx.ai Granite models
  - Streams AI responses in real-time
  - Image proxy endpoint for CORS-free image loading
  - Handles contact information and company data

- **`routes/health.ts`**: Health check endpoint
  - `/api/health` - GET endpoint for monitoring

- **`lib/logger.ts`**: Centralized logging
  - Winston-based logger
  - Console and file logging
  - Structured log format

## 📚 Documentation (`/docs`)

Project documentation and guides.

```
docs/
├── PROJECT_STRUCTURE.md    # This file - explains project organization
├── CONTRIBUTING.md         # Contribution guidelines
└── DEPLOYMENT.md          # Deployment instructions
```

## 🔧 Configuration Files

### Root Level
- **`.gitignore`**: Excludes `node_modules/`, build artifacts, `.env` files, etc.
- **`LICENSE`**: MIT License
- **`README.md`**: Main project documentation with setup instructions

### Frontend
- **`vite.config.ts`**: Vite configuration with proxy to backend
- **`tsconfig.json`**: TypeScript compiler options
- **`components.json`**: shadcn/ui component configuration
- **`package.json`**: Scripts: `dev`, `build`, `preview`

### Backend
- **`tsconfig.json`**: TypeScript compiler options for Node.js
- **`build.mjs`**: Custom build script using esbuild
- **`package.json`**: Scripts: `dev`, `build`, `start`
- **`.env.example`**: Template for environment variables

## 🚀 Key Technologies

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **jsPDF** - PDF generation
- **Lucide React** - Icon library

### Backend Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **IBM watsonx.ai** - AI/ML platform
- **Winston** - Logging
- **esbuild** - Fast bundler

## 📊 Data Flow

1. **User Input** → Frontend form (contact info, company, LinkedIn)
2. **API Request** → POST to `/api/briefing`
3. **AI Processing** → IBM watsonx.ai Granite model generates insights
4. **Streaming Response** → Real-time updates to frontend
5. **PDF Generation** → Client-side PDF creation with jsPDF
6. **Image Loading** → Backend proxy handles CORS for external images

## 🔐 Environment Variables

### Backend (`.env`)
```bash
# IBM watsonx.ai Configuration
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Frontend
No environment variables required - uses Vite proxy to backend.

## 🎯 Development Workflow

1. **Start Backend**: `cd backend && pnpm run dev` (runs on port 3000)
2. **Start Frontend**: `cd frontend && pnpm run dev` (runs on port 5173)
3. **Access App**: http://localhost:5173
4. **API Endpoint**: http://localhost:3000/api/briefing

## 📦 Build & Deployment

### Frontend Build
```bash
cd frontend
pnpm run build
# Output: frontend/dist/
```

### Backend Build
```bash
cd backend
pnpm run build
# Output: backend/dist/
```

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for detailed deployment instructions.

## 🧪 Testing

Currently, the project focuses on manual testing. Future additions:
- Unit tests with Vitest (frontend)
- Integration tests with Jest (backend)
- E2E tests with Playwright

## 📝 Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (recommended)
- **Linting**: ESLint (recommended)
- **Naming**: camelCase for variables, PascalCase for components

## 🤝 Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines on:
- Code style
- Pull request process
- Issue reporting
- Development setup

## 📄 License

This project is licensed under the MIT License - see the [`LICENSE`](../LICENSE) file for details.