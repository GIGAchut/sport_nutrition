from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

import database

database.init_db()

app = FastAPI(title="sport_nutrition")


@app.get("/api/products")
def get_products():
    return database.get_visible_products()

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend") 