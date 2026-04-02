import { Router } from "express";
import db from "../db/connection.js";
import {
  authenticateUser,
  registerUser,
  UserConflictError,
  ValidationError,
} from "../auth/service.js";
import { requireAuth, redirectIfAuthenticated } from "../middleware/auth.js";

const router = Router();

function readBodyString(body: unknown, key: string): string {
  if (!body || typeof body !== "object") {
    return "";
  }

  const value = (body as Record<string, unknown>)[key];
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

router.get("/", (req, res) => {
  res.render("home", {
    currentUserAge: req.session.userAge ?? null,
  });
});

router.get("/signup", redirectIfAuthenticated, (_req, res) => {
  res.render("signup", {
    error: null,
    form: {
      username: "",
      email: "",
      age: "",
    },
  });
});

router.post("/signup", redirectIfAuthenticated, async (req, res, next) => {
  const username = readBodyString(req.body, "username");
  const email = readBodyString(req.body, "email");
  const password = readBodyString(req.body, "password");
  const age = readBodyString(req.body, "age");

  try {
    const user = await registerUser(username, email, password, age);

    req.session.userAge = user.age;
    res.redirect("/lobby");
  } catch (error) {
    if (error instanceof UserConflictError) {
      res.status(409).render("signup", {
        error: error.message,
        form: {
          username,
          email,
          age,
        },
      });
      return;
    }

    if (error instanceof ValidationError) {
      res.status(400).render("signup", {
        error: error.message,
        form: {
          username,
          email,
          age,
        },
      });

      return;
    }

    next(error);
  }
});

router.get("/login", redirectIfAuthenticated, (_req, res) => {
  res.render("login", {
    error: null,
    form: {
      identifier: "",
    },
  });
});

router.post("/login", redirectIfAuthenticated, async (req, res, next) => {
  const identifier = readBodyString(req.body, "identifier");
  const password = readBodyString(req.body, "password");

  try {
    const user = await authenticateUser(identifier, password);
    if (!user) {
      res.status(401).render("login", {
        error: "Invalid username/email or password",
        form: {
          identifier,
        },
      });
      return;
    }

    req.session.userAge = user.age;
    res.redirect("/lobby");
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

if (process.env.NODE_ENV !== "production") {
  router.post("/dev/login", (_req, res) => {
    // fake user for local testing only
    _req.session.userAge = 21;
    res.redirect("/lobby");
  });
  router.post("/dev/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
}

router.get("/lobby", requireAuth, (req, res) => {
  res.render("lobby", {
    currentUserAge: req.session.userAge,
  });
});

/*
--------------------------------------------------
Database Test Route (checks DB connection)
--------------------------------------------------
*/
router.get("/api/db-test", async (_req, res) => {
  try {
    const result = await db.one<{ now: string }>("SELECT NOW()");
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
router.post("/api/message", async (req, res) => {
  const message = readBodyString(req.body, "message");

  try {
    const result = await db.one<Record<string, unknown>>(
      "INSERT INTO test_messages(message) VALUES($1) RETURNING *",
      [message],
    );

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
router.get("/api/messages", async (_req, res) => {
  try {
    const messages = await db.any<Record<string, unknown>>(
      "SELECT * FROM test_messages ORDER BY id DESC",
    );
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Query failed" });
  }
});
export default router;
