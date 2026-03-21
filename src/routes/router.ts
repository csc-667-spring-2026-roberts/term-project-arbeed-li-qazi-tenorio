import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.render("home");
});

// 404 catch-all (must be last)
router.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default router;
