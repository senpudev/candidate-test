# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Student Dashboard with AI Chat** technical assessment project. It features a NestJS backend with MongoDB and a React frontend, implementing a RAG (Retrieval-Augmented Generation) system for course content Q&A.

## Commands

```bash
# Development
npm run start:api          # Start backend at http://localhost:3333
npm run start:web          # Start frontend at http://localhost:5173

# Testing
npm run test:api           # Backend tests only
npm run test:web           # Frontend tests only
npm test                   # All tests

# Other
npm run seed               # Seed database with test data
npm run lint               # Lint all projects
```

Run a single test file:
```bash
npx nx test candidate-api --testFile=student.controller.spec.ts
npx nx test candidate-web --testFile=Dashboard.spec.tsx
```

## Architecture

**Nx Monorepo** with two apps:
- `apps/api/` - NestJS backend
- `apps/web/` - React frontend (Vite)
- `libs/shared/` - Shared TypeScript types

### Backend Modules (`apps/api/src/modules/`)

| Module | Purpose | Implementation Status |
|--------|---------|----------------------|
| `student/` | Student CRUD, stats, preferences | ~70% complete |
| `chat/` | Conversation management, message history | ~50% complete |
| `ai/` | OpenAI integration, response generation | ~30% complete |
| `knowledge/` | RAG system (embeddings, indexing, search) | ~20% complete |

### RAG Flow

1. **Indexing**: PDF → extract text → chunk → embed (OpenAI) → store in MongoDB (`KnowledgeChunk`)
2. **Query**: User message → embed → cosine similarity search → top-K context → OpenAI with context

The RAG system should integrate with the chat flow to provide context-aware responses.

### Frontend Structure (`apps/web/src/`)

- `pages/` - Dashboard.tsx, Chat.tsx (main views)
- `components/` - Layout, StatsCard, CourseCard, ChatInput, ChatMessage
- `hooks/useChat.ts` - Chat state management with Zustand
- `services/api.ts` - Axios API client

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `MONGODB_URI` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key (required for AI features)
- `PORT` - Backend port (default 3333)

## Test Data

After `npm run seed`:
- Student ID: `507f1f77bcf86cd799439011`
- Email: `maria@test.com`
- Course PDFs: `data/courses/`

## Development Notes

- Swagger API docs available at `http://localhost:3333/api` when backend is running
- Frontend uses TanStack Query for server state
- Styled-components for styling
- Test files use `it.todo()` placeholders for candidates to implement
