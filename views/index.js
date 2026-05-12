// Cleaned client-side todo app (GDG-themed UI)
const state = { todos: [], filter: "all" };

const api = {
  list: () =>
    fetch("/todos").then(async (r) => {
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.error || body?.message || "Failed to load");
      }
      return r.json();
    }),
  create: (task) =>
    fetch("/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task }),
    }).then(async (r) => {
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.error || body?.message || "Create failed");
      }
      return r.json();
    }),
  update: (id, body) =>
    fetch(`/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.error || body?.message || "Update failed");
      }
      return r.json();
    }),
  remove: (id) =>
    fetch(`/todos/${id}`, { method: "DELETE" }).then(async (r) => {
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.error || body?.message || "Delete failed");
      }
      return r.json();
    }),
};

const qs = (s, root = document) => root.querySelector(s);

function showError(msg) {
  const box = qs("#errorBox");
  if (!box) return;
  box.textContent = msg;
  box.classList.add("show");
}
function clearError() {
  const box = qs("#errorBox");
  if (!box) return;
  box.textContent = "";
  box.classList.remove("show");
}

function setFilter(next) {
  state.filter = next;
  document
    .querySelectorAll("[data-filter]")
    .forEach((b) => b.classList.toggle("active", b.dataset.filter === next));
  render();
}

function filtered() {
  if (state.filter === "active") return state.todos.filter((t) => !t.done);
  if (state.filter === "done") return state.todos.filter((t) => t.done);
  return state.todos;
}

function updateSummary() {
  const s = qs("#summaryText");
  if (!s) return;
  const total = state.todos.length;
  const active = state.todos.filter((t) => !t.done).length;
  const done = total - active;
  s.textContent = `${active} active • ${done} done • ${total} total`;
}

function makeItem(todo) {
  const li = document.createElement("li");
  li.className = `todo-item${todo.done ? " done" : ""}`;
  const left = document.createElement("div");
  left.className = "todo-left";
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.className = "todo-check";
  chk.checked = !!todo.done;
  chk.setAttribute("aria-label", `Mark ${todo.task} complete`);
  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.task;
  left.append(chk, text);

  const actions = document.createElement("div");
  actions.className = "todo-actions";
  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.type = "button";
  editBtn.textContent = "Edit";
  const delBtn = document.createElement("button");
  delBtn.className = "icon-btn";
  delBtn.type = "button";
  delBtn.textContent = "Delete";
  actions.append(editBtn, delBtn);

  chk.addEventListener("change", async () => {
    const prev = todo.done;
    todo.done = chk.checked;
    li.classList.toggle("done", chk.checked);
    updateSummary();
    clearError();
    try {
      const updated = await api.update(todo.id, { done: chk.checked });
      if (updated && typeof updated === "object") Object.assign(todo, updated);
    } catch (e) {
      todo.done = prev;
      chk.checked = prev;
      li.classList.toggle("done", prev);
      updateSummary();
      showError(e.message);
    }
  });

  editBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.className = "todo-edit";
    input.value = todo.task;
    left.replaceChild(input, text);
    input.focus();
    input.select();
    const save = async () => {
      const val = input.value; // send raw value so backend validation can run
      if (val === todo.task) {
        left.replaceChild(text, input);
        return;
      }
      const old = todo.task;
      // optimistic update (will be corrected if server returns different value)
      todo.task = val;
      text.textContent = val;
      left.replaceChild(text, input);
      clearError();
      try {
        const updated = await api.update(todo.id, { task: val });
        if (updated && typeof updated === "object")
          Object.assign(todo, updated);
      } catch (e) {
        todo.task = old;
        text.textContent = old;
        showError(e.message);
      }
    };
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") save();
      if (ev.key === "Escape") left.replaceChild(text, input);
    });
    input.addEventListener("blur", save);
  });

  delBtn.addEventListener("click", async () => {
    const snapshot = [...state.todos];
    state.todos = state.todos.filter((t) => t.id !== todo.id);
    render();
    clearError();
    try {
      await api.remove(todo.id);
    } catch (e) {
      state.todos = snapshot;
      render();
      showError(e.message);
    }
  });

  li.append(left, actions);
  return li;
}

function render() {
  const list = qs("#todoList");
  if (!list) return;
  list.innerHTML = "";
  const visible = filtered();
  if (visible.length === 0) {
    const e = document.createElement("li");
    e.className = "empty";
    e.textContent = "No tasks in this view yet.";
    list.appendChild(e);
    updateSummary();
    return;
  }
  visible.forEach((t) => list.appendChild(makeItem(t)));
  updateSummary();
}

async function refresh() {
  clearError();
  try {
    const todos = await api.list();
    state.todos = Array.isArray(todos) ? todos : [];
    render();
  } catch (e) {
    showError(e.message);
  }
}

async function onCreate(e) {
  e.preventDefault();
  const input = qs("#todoInput");
  if (!input) return;
  const task = input.value.trim();
  clearError();
  try {
    const created = await api.create(task);
    state.todos.push(created);
    input.value = "";
    render();
  } catch (err) {
    showError(err.message);
  }
}

async function clearCompleted() {
  const done = state.todos.filter((t) => t.done);
  if (!done.length) return;
  const snapshot = [...state.todos];
  state.todos = state.todos.filter((t) => !t.done);
  render();
  try {
    await Promise.all(done.map((t) => api.remove(t.id)));
  } catch (e) {
    state.todos = snapshot;
    render();
    showError(e.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  qs("#todoForm")?.addEventListener("submit", onCreate);
  qs("#clearDoneBtn")?.addEventListener("click", clearCompleted);
  document
    .querySelectorAll("[data-filter]")
    .forEach((b) =>
      b.addEventListener("click", () => setFilter(b.dataset.filter)),
    );
  refresh();
});
