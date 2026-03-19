import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.redirect("/login");
    return;
  }

  next();
}

export function redirectIfAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.session.userId) {
    res.redirect("/lobby");
    return;
  }

  next();
}
