import "dotenv/config";
import express from "express";
import indexRouter from "./routes/router.js";
import db from "./db/connection.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "views");

app.use("/", indexRouter);

/*
--------------------------------------------------
Database Test Route (checks DB connection)
--------------------------------------------------
*/
app.get("/api/db-test", async (_req, res) => {
  try {
    const result = await db.one("SELECT NOW()");
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

/*
--------------------------------------------------
POST route (write to database)
--------------------------------------------------
*/
app.post("/api/message", async (req, res) => {
  const { message } = req.body;

  try {
    const result = await db.one("INSERT INTO test_messages(message) VALUES($1) RETURNING *", [
      message,
    ]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Insert failed" });
  }
});

/*
--------------------------------------------------
GET route (read from database)
--------------------------------------------------
*/
app.get("/api/messages", async (_req, res) => {
  try {
    const messages = await db.any("SELECT * FROM test_messages ORDER BY id DESC");
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Query failed" });
  }
});

app.listen(port, () => {
  console.log(`Server is on http://localhost:${String(port)}`);
});
