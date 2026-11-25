import sqlite3
from datetime import datetime
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
         ("WHEY PROTEIN CHROME",
                  "Сывороточный протеин высшего качества. 25г белка на порцию для максимального роста.",
                  3500, "assets/images/protein.png"),
    ]
    connection.executemany(
        "INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)",
        products,
    )


def init_db():
    """Создаёт таблицу, если её нет, и заполняет её стартовыми товарами."""
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

    connection.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            total INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            price INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )
    """)

    count = connection.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if count == 0:
        add_start_products(connection)

    connection.commit()
    connection.close()


def get_visible_products():
    """Товары для покупателей"""
    connection = get_connection()
    rows = connection.execute(
        "SELECT * FROM products WHERE is_visible = 1 ORDER BY id"
    ).fetchall()
    connection.close()
    return [dict(row) for row in rows]


def get_all_products():
    """Товары для админа"""
    connection = get_connection()
    rows = connection.execute("SELECT * FROM products ORDER BY id").fetchall()
    connection.close()
    return [dict(row) for row in rows]


def set_product_visibility(product_id, is_visible):
    """Скрывает или показывает товар"""
    connection = get_connection()
    cursor = connection.execute(
        "UPDATE products SET is_visible = ? WHERE id = ?",
        (int(is_visible), product_id),
    )
    connection.commit()
    found = cursor.rowcount > 0
    connection.close()
    return found


def add_product(name, description, price, image):
    """Добавляет товар"""
    connection = get_connection()
    cursor = connection.execute(
        "INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)",
        (name, description, price, image),
    )
    connection.commit()
    product_id = cursor.lastrowid
    connection.close()
    return product_id


def delete_product(product_id):
    """Удаляет товар"""
    connection = get_connection()
    cursor = connection.execute("DELETE FROM products WHERE id = ?", (product_id,))
    connection.commit()
    found = cursor.rowcount > 0
    connection.close()
    return found

def create_order(customer_name, phone, address, items):
    """Создаёт заказ"""
    connection = get_connection()
    try:
        total = 0
        lines = []

        for item in items:
            row = connection.execute(
                "SELECT * FROM products WHERE id = ? AND is_visible = 1",
                (item["product_id"],),
            ).fetchone()

            if row is None:
                raise ValueError("Товар с id " + str(item["product_id"]) + " недоступен")

            total += row["price"] * item["quantity"]
            lines.append((row["id"], row["name"], row["price"], item["quantity"]))

        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor = connection.execute(
            "INSERT INTO orders (customer_name, phone, address, total, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (customer_name, phone, address, total, created_at),
        )
        order_id = cursor.lastrowid

        for product_id, name, price, quantity in lines:
            connection.execute(
                "INSERT INTO order_items (order_id, product_id, product_name, price, quantity) "
                "VALUES (?, ?, ?, ?, ?)",
                (order_id, product_id, name, price, quantity),
            )

        connection.commit()
        return order_id, total
    finally:
        connection.close()


def get_all_orders():
    """Все заказы"""
    connection = get_connection()

    orders = connection.execute("SELECT * FROM orders ORDER BY id DESC").fetchall()
    result = []

    for order in orders:
        items = connection.execute(
            "SELECT product_name, price, quantity FROM order_items WHERE order_id = ?",
            (order["id"],),
        ).fetchall()

        order_data = dict(order)
        order_data["items"] = [dict(item) for item in items]
        result.append(order_data)

    connection.close()
    return result