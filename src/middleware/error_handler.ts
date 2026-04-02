import { ErrorRequestHandler, RequestHandler } from "express";

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

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).send("Not Found");
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error(err);
  const code = (err as { code?: string }).code;
  if (code === "42P01") {
    const message = "Auth database is not ready yet. Please try again shortly.";
    if (req.path === "/login" && req.method === "POST") {
      res.status(503).render("login", {
        error: message,
        form: { identifier: readBodyString(req.body, "identifier") },
      });
      return;
    }
    if (req.path === "/signup" && req.method === "POST") {
      res.status(503).render("signup", {
        error: message,
        form: {
          username: readBodyString(req.body, "username"),
          email: readBodyString(req.body, "email"),
          age: readBodyString(req.body, "age"),
        },
      });
      return;
    }
    if (req.path.startsWith("/api/")) {
      res.status(503).json({ error: "Database not ready" });
      return;
    }
    res.status(503).send(message);
    return;
  }
  if (req.path.startsWith("/api/")) {
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
  res.status(500).send("Internal Server Error");
};
