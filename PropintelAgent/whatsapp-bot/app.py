from fastapi import FastAPI
from mangum import Mangum
from routers.webhook import router as webhook_router

app = FastAPI()
app.include_router(webhook_router)

# health root (simple)
@app.get("/")
def health():
    return {"status": "ok"}

# Lambda handler
handler = Mangum(app)
