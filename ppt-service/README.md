# NetRoot AI Presentation Service (PPT Service)

A high-performance, stateless FastAPI microservice for AI presentation generation and PowerPoint (`.pptx`) rendering.

---

## Key Features

- **100% Stateless & In-Memory:** Generates and streams `.pptx` presentations directly from RAM (`io.BytesIO`). Zero temporary files or disk writes on the server.
- **High-Speed AI Generation:** Powered by Groq Cloud LPU APIs with resilient fallback heuristics.
- **Dynamic Bento & Rhythm Engine:** Automatically harmonizes dark hero covers, light canvas content, and card themes across decks.
- **Slide Copilot:** Natural-language slide edits, bullet suggestions, text restyling, and stock photo searches.

---

## Directory Structure

```text
ppt-service/
├── app.py             # FastAPI application and route handlers
├── llm_planner.py     # AI presentation planner, schemas, prompts & copilot
├── pptx_builder.py    # Native python-pptx rendering and theme engine
├── image_service.py   # Unsplash and image integration utilities
├── run.py             # Standalone development entrypoint
├── requirements.txt   # Python package dependencies
└── README.md          # Documentation
```

---

## Environment Configuration (Single Root `.env`)

All environment variables are loaded directly from the project's root `.env` file (no nested `.env` required):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | *(Required)* | Shared Groq API key for LPU model inference |
| `PPT_MODEL` | `qwen/qwen3.8-27b` | LLM model for PPT generation (no conflict with `GROQ_MODEL`) |
| `PPT_PORT` | `8001` | Service listening port (no conflict with `API_PORT=3001`) |
| `PPT_HOST` | `127.0.0.1` | Service host binding (`0.0.0.0` for public VPS) |
| `UNSPLASH_ACCESS_KEY` | *(Optional)* | Key for curated stock photography |
| `VITE_PPT_API_URL` | `http://127.0.0.1:8001` | Frontend API connection URL |
| `PPT_SERVICE_URL` | `http://127.0.0.1:8001/api/generate` | Node backend internal endpoint |

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
# Python 3.10+ recommended
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Start the Service
```bash
python run.py
```
Service runs on: `http://127.0.0.1:8001`

---

## Production / VPS Deployment

Run in the background using PM2 or systemd:

```bash
# Production with multiple Uvicorn workers:
uvicorn app:app --host 0.0.0.0 --port 8001 --workers 2

# Using PM2:
pm2 start "uvicorn app:app --host 0.0.0.0 --port 8001 --workers 2" --name "ppt-service"
```

---

## Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service health status check |
| `GET` | `/api/models` | Available LLM models list |
| `POST` | `/api/generate-outline` | Fast agenda/outline generation |
| `POST` | `/api/generate` | Full multi-slide presentation DSL generation |
| `POST` | `/api/render` | Renders and streams binary `.pptx` file directly |
| `POST` | `/api/regenerate-slide` | Regenerates a single slide's content/layout |
| `POST` | `/api/copilot-edit-slide` | Natural-language AI slide modification |
| `POST` | `/api/restyle-text` | Restyles/polishes a specific bullet point |
| `POST` | `/api/suggest-point` | Auto-generates complementary bullet point |
| `GET` | `/api/search-image` | Fetches web visual for a search query |
| `GET` | `/api/search-image-candidates`| Fetches Unsplash image candidates |
