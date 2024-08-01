const express = require("express");
const mysql = require("mysql2");
const app = express();
const multer = require("multer");
const bodyParser = require("body-parser");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images - Copy");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "c237_departmentstoreapp"
});

connection.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        return;
    }
    console.log("Connected to MySQL database");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");

const port = 3000;

app.get("/", (req, res) => {
    const sql = "SELECT * FROM products";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error: ", error.message);
            return res.status(500).send("Error retrieving products");
        }
        console.log(results); 
        res.render("index", { products: results });
    });
});

app.get("/addProduct", (req, res) => {
    res.render("addProduct");
});

app.post("/product", upload.single("image"), (req, res) => {
    const { name, quantity, price } = req.body;
    const image = req.file ? req.file.filename : null;

    const sql = "INSERT INTO products (productName, quantity, price, image) VALUES (?, ?, ?, ?)";
    connection.query(sql, [name, quantity, price, image], (error, results) => {
        if (error) {
            console.error("Database adding error: ", error.message);
            return res.status(500).send("Error adding product");
        }
        res.redirect("/");
    });
});

app.get("/deleteProduct/:id", (req, res) => {
    const productId = req.params.id;
    const sql = "DELETE FROM products WHERE productId = ?";
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error deleting product");
        }
        res.redirect("/");
    });
});

app.get("/editProduct/:id", (req, res) => {
    const productId = req.params.id;
    const sql = "SELECT * FROM products WHERE productId = ?";
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving product");
        }
        if (results.length > 0) {
            res.render("editProduct", { product: results[0] });
        } else {
            res.status(404).send("Product not found");
        }
    });
});

app.post("/editProduct/:id", upload.single("image"), (req, res) => {
    const productId = req.params.id;
    const { name, quantity, price } = req.body;
    const image = req.file ? req.file.filename : req.body.existingImage;

    const sql = "UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE productId = ?";
    connection.query(sql, [name, quantity, price, image, productId], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error updating product");
        }
        res.redirect("/");
    });
});

app.get("/users", (req, res) => {
    const sql = "SELECT * FROM users";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving users");
        }
        res.render("users", { users: results });
    });
});

app.get("/reviews", (req, res) => {
    const sql = `
        SELECT r.review_id, r.product_id, r.user_id, r.review_description, r.rating, p.productName, u.username
        FROM reviews r
        JOIN products p ON r.product_id = p.productId
        JOIN users u ON r.user_id = u.user_id
    `;
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving reviews");
        }
        console.log("Reviews fetched:", results);
        res.render("reviews", { reviews: results });
    });
});

app.get("/items", (req, res) => {
    const sql = "SELECT * FROM item";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving items");
        }
        res.render("items", { items: results });
    });
});

app.get("/cart", (req, res) => {
    const sql = `
        SELECT c.cart_id, c.user_id, c.product_id, c.quantity, p.productName, p.price, p.image
        FROM cart c
        JOIN products p ON c.product_id = p.productId
    `;
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving cart items");
        }
        res.render("cart", { cartItems: results });
    });
});

app.get("/addtocart", (req, res) => {
    const sql = "SELECT * FROM products";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving products");
        }
        res.render("addtocart", { products: results });
    });
});

app.post("/addtocart", (req, res) => {
    const { user_id, product_id, quantity } = req.body;
    const sql = "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
    connection.query(sql, [user_id, product_id, quantity], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error adding item to cart");
        }
        res.redirect("/cart");
    });
});

app.get("/editcart/:id", (req, res) => {
    const cartId = req.params.id;
    const sql = "SELECT * FROM cart WHERE cart_id = ?";
    connection.query(sql, [cartId], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving cart item");
        }
        if (results.length > 0) {
            res.render("editcart", { cartItem: results[0] });
        } else {
            res.status(404).send("Cart item not found");
        }
    });
});

app.post("/editcart/:id", (req, res) => {
    const cartId = req.params.id;
    const { user_id, product_id, quantity } = req.body;
    const sql = "UPDATE cart SET user_id = ?, product_id = ?, quantity = ? WHERE cart_id = ?";
    connection.query(sql, [user_id, product_id, quantity, cartId], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error updating cart item");
        }
        res.redirect("/cart");
    });
});

app.get("/categories", (req, res) => {
    const sql = "SELECT * FROM category";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving categories");
        }
        res.render("categories", { categories: results });
    });
});

app.post("/category/add", (req, res) => {
    const { category_description } = req.body;
    const sql = "INSERT INTO category (category_description) VALUES (?)";
    connection.query(sql, [category_description], (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error adding category");
        }
        res.redirect("/categories");
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
