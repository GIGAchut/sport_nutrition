from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import database

database.init_db()

app = FastAPI(title="sport_nutrition")

class VisibilityUpdate(BaseModel):
    is_visible: bool


@app.get("/api/products")
def get_products():
    return database.get_visible_products()


@app.get("/api/admin/products")
def get_admin_products():
    return database.get_all_products()


@app.put("/api/admin/products/{product_id}/visibility")
def update_visibility(product_id: int, data: VisibilityUpdate):
    found = database.set_product_visibility(product_id, data.is_visible)

    if not found:
        raise HTTPException(status_code=404, detail="Товар не найден")

    return {"id": product_id, "is_visible": data.is_visible}


FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")