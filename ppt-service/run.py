import os
from pathlib import Path
import uvicorn
from dotenv import load_dotenv

_CURRENT_DIR = Path(__file__).resolve().parent
_ROOT_ENV = _CURRENT_DIR.parent / ".env" if _CURRENT_DIR.name == "ppt-service" else _CURRENT_DIR / ".env"
if _ROOT_ENV.exists():
    load_dotenv(_ROOT_ENV)
load_dotenv()

if __name__ == "__main__":
    host = os.getenv("PPT_HOST") or os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PPT_PORT") or os.getenv("PORT", 8001))
    uvicorn.run("app:app", host=host, port=port, reload=True)
