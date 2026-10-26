import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "shop.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def add_start_products(connection):
    products = [
        ("WHEY PROTEIN CHROME",
         "Сывороточный протеин высшего качества. 25г белка на порцию для максимального роста.",
         3500, "assets/images/protein.png"),
        ("CREATINE MONOHYDRATE",
         "Чистый креатин для взрывной силы и выносливости. Микронизированная формула.",
         1800, "assets/images/creatine.png"),
        ("PRE-WORKOUT TITAN",
         "Мощный предтренировочный комплекс для максимального фокуса и энергии.",
         2900, "assets/images/preworkout.png"),
        ("BCAA RECOVERY",
         "Аминокислоты с разветвленной цепью для быстрого восстановления мышц после нагрузок.",
         2200, "assets/images/bcaa.png"),
    ]
    connection.executemany(
        "INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)",
        products,
    )


def init_db():
    connection = get_connection()
    connection.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            price INTEGER NOT NULL,
            image TEXT NOT NULL,
            is_visible INTEGER NOT NULL DEFAULT 1
        )
    """)

    count = connection.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if count == 0:
        add_start_products(connection)

    connection.commit()
    connection.close()


def get_visible_products():
    connection = get_connection()
    rows = connection.execute(
        "SELECT * FROM products WHERE is_visible = 1"
    ).fetchall()
    connection.close()
    return [dict(row) for row in rows]