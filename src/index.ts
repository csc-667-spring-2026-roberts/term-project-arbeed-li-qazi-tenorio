import express from "express";

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("Texas Hold 'Em server is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});
