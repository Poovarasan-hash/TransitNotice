import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.config import settings
from backend.app.seed import seed_db
from backend.app.services.scheduler import scheduler_service

from backend.app.routers.auth import router as auth_router
from backend.app.routers.notices import router as notices_router
from backend.app.routers.routes import router as routes_router
from backend.app.routers.coverage import router as coverage_router
from backend.app.routers.alerts import router as alerts_router
from backend.app.routers.system import router as system_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed Database & Start Scheduler
    seed_db()
    scheduler_service.start()
    # Trigger first refresh asynchronously
    asyncio_task = asyncio.create_task(scheduler_service.run_all_refreshes())
    yield
    # Shutdown: Stop Scheduler
    scheduler_service.stop()

import asyncio

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TransitNotice — Public Transport Service Update Tracker API (FastAPI + PostgreSQL/SQLAlchemy)",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(notices_router, prefix="/api")
app.include_router(routes_router, prefix="/api")
app.include_router(coverage_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(system_router, prefix="/api")

# Serve Client Build if present
client_dist = Path(__file__).resolve().parent.parent.parent / "client" / "dist"
if client_dist.exists():
    app.mount("/assets", StaticFiles(directory=client_dist / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return {"error": "Not Found"}
        target_file = client_dist / full_path
        if target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(client_dist / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
