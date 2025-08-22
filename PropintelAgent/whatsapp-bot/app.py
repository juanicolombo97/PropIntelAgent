from fastapi import FastAPI
from mangum import Mangum
from routers.webhook import router as webhook_router
from routers.admin import router as admin_router

app = FastAPI()
app.include_router(webhook_router)
app.include_router(admin_router)

@app.get("/")
def health():
    return {"status": "ok"}

handler = Mangum(app)
