// Single validation middleware for create (POST) and update (PATCH)
// - POST: requires `task` present and non-empty
// - PATCH: if `task` is present, it must be non-empty
export default function validateTask(req, res, next) {
  if (req.method === "POST") {
    const task = (req.body.task ?? "").toString().trim();
    if (!task) return res.status(400).json({ error: "Task is required" });
    req.body.task = task;
    return next();
  }

  if (req.method === "PATCH") {
    if (req.body.task !== undefined) {
      const t = req.body.task.toString().trim();
      if (!t) return res.status(400).json({ error: "Task cannot be empty" });
      req.body.task = t;
    }
    return next();
  }

  return next();
}
