import { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).send("Not Found");
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error(err);
  const code = (err as { code?: string }).code;
  if (code === "42P01") {
    const message = "Auth database is not ready yet. Please try again shortly.";
    if (req.path === "/login" && req.method === "POST") {
      res
        .status(503)
        .render("login", {
          error: message,
          form: { identifier: String(req.body.identifier ?? "") },
        });
      return;
    }
    if (req.path === "/signup" && req.method === "POST") {
      res.status(503).render("signup", {
        error: message,
        form: {
          username: String(req.body.username ?? ""),
          email: String(req.body.email ?? ""),
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
