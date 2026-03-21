import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import indexRouter from "./routes/router.js";
import db from "./db/connection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../public")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../../views"));

// Routes
app.use("/", indexRouter);

// Centralized error handler (must be last)
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  },
);

// Verify DB connection at startup
void (async (): Promise<void> => {
  try {
    const obj = await db.connect();
    void obj.done();
    console.log("Database connected successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Database connection failed:", message);
    process.exit(1);
  }
})();

app.listen(port, () => {
  console.log(`Server is on http://localhost:${String(port)}`);
});
