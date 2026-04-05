"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.forecasts import router as forecasts_router
from routers.agents import router as agents_router

app = FastAPI(
    title="CS568 Epidemic Forecasting API",
    description="4-week hospital admission forecasts for influenza and COVID-19",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecasts_router, prefix="/api")
app.include_router(agents_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
