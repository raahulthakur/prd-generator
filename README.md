# PRD Generator

AI-powered one-pager PRD generator. Describe your problem → get a structured Product Requirements Document instantly.

## Stack
- **Frontend**: React + TypeScript + Vite + shadcn/ui + Tailwind CSS v4
- **Backend**: FastAPI + Python + OpenRouter Integration (LLM Gateway)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on http://localhost:8000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Usage

1. Open http://localhost:5173
2. Type your problem statement in the input box
3. Press **Submit** (or ⌘↵ / Ctrl↵)
4. Your one-pager PRD appears instantly
5. Copy the output or start a new PRD
