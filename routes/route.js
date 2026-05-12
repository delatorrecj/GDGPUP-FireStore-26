import { Router } from "express";
import render from "../render.js";
import validateTask from "../middlewares/validateTask.js";

// Import the collection reference
import { todosRef } from "../app.js";

const router = Router();

// ROUTES
// Index Route
router.get("/", (req, res) => {
  res.sendFile(render("index.html"));
});

// Get all todos
router.get("/todos", async (req, res) => {
  try {
    const snapshot = await todosRef.get();
    const todos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(todos);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch from database" });
  }
});

// New todo
router.post("/todos", validateTask, async (req, res) => {
  try {
    const newTodo = {
      task: req.body.task,
      done: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await todosRef.add(newTodo);
    res.status(201).json({ id: doc.id, ...newTodo });
  } catch (e) {
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Update todo
router.patch("/todos/:id", validateTask, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Only update fields that were actually sent
    if (req.body.task !== undefined) updateData.task = req.body.task;
    if (req.body.done !== undefined) updateData.done = req.body.done;

    await todosRef.doc(id).update(updateData);
    res.status(200).json({ id, ...updateData });
  } catch (e) {
    res.status(404).json({ error: "Todo not found or update failed" });
  }
});

// Delete todo
router.delete("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await todosRef.doc(id).delete();
    res.status(200).json({ message: "Deleted successfully", id });
  } catch (e) {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
