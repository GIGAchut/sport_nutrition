import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import database

database.init_db()

app = FastAPI(title="AKSENOV shop")

IMAGES_DIR = Path(__file__).parent.parent / "frontend" / "assets" / "images"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_NAME_LENGTH = 60
MAX_DESCRIPTION_LENGTH = 300
MAX_PRICE = 1000000

class VisibilityUpdate(BaseModel):
    is_visible: bool

class OrderItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, le=100)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=3, max_length=30)
    phone: str = Field(pattern=r"^7 \d{3} \d{3} \d{4}$")
    address: str = Field(min_length=5, max_length=300)
    items: list[OrderItem] = Field(min_length=1, max_length=50)

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


def save_image(image: UploadFile):
    """Сохраняет загруженное фото в frontend/images"""
    extension = Path(image.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Фото должно быть в формате JPG, PNG или WEBP")

    content = image.file.read(MAX_IMAGE_SIZE + 1)
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Фото больше 5 МБ")

    file_name = uuid.uuid4().hex + extension
    (IMAGES_DIR / file_name).write_bytes(content)

    return "assets/images/" + file_name


@app.post("/api/admin/products")
def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: int = Form(...),
    image: UploadFile | None = File(default=None),
):
    name = name.strip()
    description = description.strip()

    if name == "" or description == "":
        raise HTTPException(status_code=400, detail="Название и описание не могут быть пустыми")

    if len(name) > MAX_NAME_LENGTH:
        raise HTTPException(status_code=400, detail="Название длиннее 60 символов")

    if len(description) > MAX_DESCRIPTION_LENGTH:
        raise HTTPException(status_code=400, detail="Описание длиннее 300 символов")

    if price < 1 or price > MAX_PRICE:
        raise HTTPException(status_code=400, detail="Цена должна быть от 1 до 100000")

    image_path = ""
    if image is not None and image.filename:
        image_path = save_image(image)

    product_id = database.add_product(name, description, price, image_path)
    return {"id": product_id}


@app.delete("/api/admin/products/{product_id}")
def delete_product(product_id: int):
    found = database.delete_product(product_id)

    if not found:
        raise HTTPException(status_code=404, detail="Товар не найден")

    return {"id": product_id}

@app.post("/api/orders")
def create_order(order: OrderCreate):
    items = []
    for item in order.items:
        items.append({"product_id": item.product_id, "quantity": item.quantity})

    try:
        order_id, total = database.create_order(
            order.customer_name.strip(), order.phone, order.address.strip(), items
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    return {"order_id": order_id, "total": total}


@app.get("/api/admin/orders")
def get_admin_orders():
    return database.get_all_orders()

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
