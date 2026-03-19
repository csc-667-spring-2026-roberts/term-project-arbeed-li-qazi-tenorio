import "dotenv/config";
import express from "express";
import indexRouter from "./routes/router.js";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { errorHandler, notFoundHandler } from "./middleware/error_handler.js";

const app = express();
const port = process.env.PORT || 3000;
const PgSession = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET is not set");
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "views");

//session
app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use("/", indexRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is on http://localhost:${String(port)}`);
});
