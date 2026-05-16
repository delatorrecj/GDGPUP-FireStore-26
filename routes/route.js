import { Router } from "express";
import render from "../render.js";
// Middlewares
import validateTask from "../middlewares/validateTask.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";
// Import the collection reference
import { todosRef } from "../app.js";

const router = Router();

// In-memory storage for anonymous (non-authenticated) todos
const anonTodos = {};

// ROUTES
// Index Route
router.get("/", (req, res) => {
  res.sendFile(render("index.html"));
});

// Get all todos
router.get("/todos", optionalAuth, async (req, res) => {
  try {
    if (req.user) {
      // Authenticated: fetch from Firestore, filtered by user
      const snapshot = await todosRef.where("userId", "==", req.user.uid).get();
      const todos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.status(200).json(todos);
    } else {
      // Anonymous: return in-memory todos (session-based)
      const sessionId = req.sessionID || "default";
      res.status(200).json(anonTodos[sessionId] || []);
    }
  } catch (e) {
    console.error("Error fetching todos:", e);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// New todo
router.post("/todos", optionalAuth, validateTask, async (req, res) => {
  try {
    if (req.user) {
      // Authenticated: save to Firestore
      const newTodo = {
        task: req.body.task,
        done: false,
        createdAt: new Date().toISOString(),
        userId: req.user.uid,
      };

      const docRef = await todosRef.add(newTodo);
      res.status(201).json({ id: docRef.id, ...newTodo });
    } else {
      // Anonymous: store in memory with a client-generated ID
      const sessionId = req.sessionID || "default";
      if (!anonTodos[sessionId]) anonTodos[sessionId] = [];

      const newTodo = {
        id: "anon-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
        task: req.body.task,
        done: false,
        createdAt: new Date().toISOString(),
      };

      anonTodos[sessionId].push(newTodo);
      res.status(201).json(newTodo);
    }
  } catch (e) {
    console.error("Error creating todo:", e);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Update todo
router.patch("/todos/:id", optionalAuth, validateTask, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user) {
      // Authenticated: update in Firestore (verify ownership)
      const docSnap = await todosRef.doc(id).get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Todo not found" });
      }
      if (docSnap.data().userId !== req.user.uid) {
        return res.status(403).json({ error: "Forbidden: Todo does not belong to you" });
      }

      const updateData = {};
      if (req.body.task !== undefined) updateData.task = req.body.task;
      if (req.body.done !== undefined) updateData.done = req.body.done;

      await todosRef.doc(id).update(updateData);
      res.status(200).json({ id, ...updateData });
    } else {
      // Anonymous: update in memory
      const sessionId = req.sessionID || "default";
      const todos = anonTodos[sessionId] || [];
      const todo = todos.find((t) => t.id === id);

      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }

      if (req.body.task !== undefined) todo.task = req.body.task;
      if (req.body.done !== undefined) todo.done = req.body.done;

      res.status(200).json(todo);
    }
  } catch (e) {
    console.error("Error updating todo:", e);
    res.status(500).json({ error: "Update failed" });
  }
});

// Delete todo
router.delete("/todos/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user) {
      // Authenticated: delete from Firestore (verify ownership)
      const docSnap = await todosRef.doc(id).get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Todo not found" });
      }
      if (docSnap.data().userId !== req.user.uid) {
        return res.status(403).json({ error: "Forbidden: Todo does not belong to you" });
      }

      await todosRef.doc(id).delete();
      res.status(200).json({ message: "Deleted successfully", id });
    } else {
      // Anonymous: delete from memory
      const sessionId = req.sessionID || "default";
      const todos = anonTodos[sessionId] || [];
      const index = todos.findIndex((t) => t.id === id);

      if (index === -1) {
        return res.status(404).json({ error: "Todo not found" });
      }

      todos.splice(index, 1);
      res.status(200).json({ message: "Deleted successfully", id });
    }
  } catch (e) {
    console.error("Error deleting todo:", e);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;

