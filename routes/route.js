import { Router } from "express";
import fs from "fs";
import render from "../render.js";
import path from "path";
import validateTask from "../middlewares/validateTask.js";

const router = Router();

// Fix __dirname for ES modules
const __dirname = import.meta.dirname;

// Path to our JSON storage file
const todoFile = path.join(__dirname, "../", "todo.json");

// Helper: read todos from file
function readTodo() {
  if (!fs.existsSync(todoFile)) return "Database Not found";
  const data = fs.readFileSync(todoFile, "utf-8").trim();
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Helper: write todos to file
function writeTodo(todos) {
  fs.writeFileSync(todoFile, JSON.stringify(todos, null, 2));
}

// ROUTES

// Index Route

router.get("/", (req, res) => {
  res.sendFile(render("index.html"));
});

// Crud Operations (Static Routes)

router.get("/todos", (req, res) => {
  const todos = readTodo();
  if (todos === "Database Not found")
    res.status(500).json("Failed to fetch to database");
  res.status(200).json(todos);
});

router.post("/todos", validateTask, (req, res) => {
  const task = req.body.task;

  const todos = readTodo();
  if (todos === "Database Not found")
    return res.status(500).json("Failed to fetch to database");

  const newTodo = {
    id: todos.length ? todos[todos.length - 1].id + 1 : 1,
    task,
    done: false,
  };

  todos.push(newTodo);
  writeTodo(todos);
  res.status(200).json(newTodo);
});

// Dynamic Routes

router.patch("/todos/:id", validateTask, (req, res) => {
  const todos = readTodo();
  if (todos === "Database Not found")
    return res.status(500).json("Failed to fetch to database");

  const todo = todos.find((t) => t.id === parseInt(req.params.id));
  if (!todo) return res.status(404).send("Todo not found");

  todo.task = req.body.task ?? todo.task;
  todo.done = req.body.done ?? todo.done;

  writeTodo(todos);
  res.status(200).json(todo);
});

router.delete("/todos/:id", (req, res) => {
  let todos = readTodo();
  if (todos === "Database Not found")
    res.status(500).json("Failed to fetch to database");

  const index = todos.findIndex((t) => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).send("Todo not found");

  const deleted = todos.splice(index, 1);
  writeTodo(todos);
  res.status(200).json(deleted[0]);
});

export default router;
