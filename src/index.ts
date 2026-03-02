import "dotenv/config";
import express from "express";
import indexRouter from "./routes/router.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "views");

app.use("/", indexRouter);

app.listen(port, () => {
    console.log(`Server is on  http://localhost:${port}`);
});
