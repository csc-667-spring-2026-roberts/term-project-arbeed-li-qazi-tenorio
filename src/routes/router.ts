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

router.get("/", (req, res) => {
  res.render("home", {
    currentUserId: req.session.userId ?? null,
  });
});

router.get("/signup", redirectIfAuthenticated, (_req, res) => {
  res.render("signup", {
    error: null,
    form: {
      username: "",
      email: "",
    },
  });
});

router.post("/signup", redirectIfAuthenticated, async (req, res, next) => {
  const username = String(req.body.username ?? "");
  const email = String(req.body.email ?? "");
  const password = String(req.body.password ?? "");

  try {
    const user = await registerUser(username, email, password);

    req.session.userId = user.id;
    res.redirect("/lobby");
  } catch (error) {
    if (error instanceof UserConflictError) {
      res.status(409).render("signup", {
        error: error.message,
        form: {
          username,
          email,
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
  const identifier = String(req.body.identifier ?? "");
  const password = String(req.body.password ?? "");

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

    req.session.userId = user.id;
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
    _req.session.userId = 1;
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
    currentUserId: req.session.userId,
  });
});

/*
--------------------------------------------------
Database Test Route (checks DB connection)
--------------------------------------------------
*/
router.get("/api/db-test", async (_req, res) => {
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
router.post("/api/message", async (req, res) => {
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
router.get("/api/messages", async (_req, res) => {
  try {
    const messages = await db.any("SELECT * FROM test_messages ORDER BY id DESC");
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Query failed" });
  }
});
export default router;
