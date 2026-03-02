import express from "express";
import { createTestHand } from "./game/engine.js";

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.get("/", (_req, res) => {
  res.status(200).send("Texas Hold 'Em server is running ✅");
});

app.get("/api/test-hand", (_req, res) => {
  res.json(createTestHand());
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});
