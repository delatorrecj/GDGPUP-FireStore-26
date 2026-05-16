// Cleaned client-side todo app (GDG-themed UI)
const state = { todos: [], filter: "all" };

// --- Auth integration and API handling ---
const authEnabled = typeof firebase !== "undefined" && window.FIREBASE_CONFIG;
if (authEnabled) {
  try {
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
  } catch (e) {
    console.warn("Firebase init failed:", e);
  }
}

async function getIdTokenForRequest() {
  if (authEnabled && firebase.auth().currentUser) {
    try {
      return await firebase.auth().currentUser.getIdToken();
    } catch (e) {
      console.warn("Failed to get id token:", e);
      return null;
    }
  }
  return null;
}

async function authFetch(url, opts = {}) {
  const headers = new Headers(opts.headers || {});
  const token = await getIdTokenForRequest();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...opts, headers });
  return res;
}

// Use localStorage for anonymous todos (lost on refresh), Firestore for authenticated
const ANON_STORAGE_KEY = "gdg_anon_todos";

const api = {
  list: async () => {
    if (authEnabled && firebase.auth().currentUser) {
      // Authenticated: fetch from server (Firestore)
      const r = await authFetch("/todos");
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.error || body?.message || "Failed to load");
      }
      return r.json();
    } else {
      // Anonymous: load from localStorage
      const stored = localStorage.getItem(ANON_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  },
  create: async (task) => {
    if (authEnabled && firebase.auth().currentUser) {
      // Authenticated: save to server (Firestore)
      const r = await authFetch("/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.error || body?.message || "Create failed");
      }
      return r.json();
    } else {
      // Anonymous: save to localStorage
      const todos = JSON.parse(localStorage.getItem(ANON_STORAGE_KEY) || "[]");
      const newTodo = {
        id: "anon-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
        task,
        done: false,
        createdAt: new Date().toISOString(),
      };
      todos.push(newTodo);
      localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(todos));
      return newTodo;
    }
  },
  update: async (id, body) => {
    if (authEnabled && firebase.auth().currentUser) {
      // Authenticated: update on server (Firestore)
      const r = await authFetch(`/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.error || body?.message || "Update failed");
      }
      return r.json();
    } else {
      // Anonymous: update in localStorage
      const todos = JSON.parse(localStorage.getItem(ANON_STORAGE_KEY) || "[]");
      const todo = todos.find((t) => t.id === id);
      if (!todo) throw new Error("Todo not found");
      if (body.task !== undefined) todo.task = body.task;
      if (body.done !== undefined) todo.done = body.done;
      localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(todos));
      return todo;
    }
  },
  remove: async (id) => {
    if (authEnabled && firebase.auth().currentUser) {
      // Authenticated: delete from server (Firestore)
      const r = await authFetch(`/todos/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.error || body?.message || "Delete failed");
      }
      return r.json();
    } else {
      // Anonymous: delete from localStorage
      const todos = JSON.parse(localStorage.getItem(ANON_STORAGE_KEY) || "[]");
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) throw new Error("Todo not found");
      todos.splice(index, 1);
      localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(todos));
      return { message: "Deleted", id };
    }
  },
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

  // Auth UI bindings
  const loginForm = qs("#loginForm");
  const emailInput = qs("#emailInput");
  const passwordInput = qs("#passwordInput");
  const signUpBtn = qs("#signUpBtn");
  const signOutBtn = qs("#signOutBtn");
  const userStatus = qs("#userStatus");

  function updateAuthUI(user) {
    if (user) {
      userStatus.textContent = `Signed in as ${user.email || user.uid}`;
      loginForm?.classList?.add("hidden");
      signOutBtn?.classList?.remove("hidden");
    } else {
      userStatus.textContent = authEnabled ? "Not signed in" : "No Firebase config (see firebase-config.js)";
      loginForm?.classList?.remove("hidden");
      signOutBtn?.classList?.add("hidden");
    }
  }

  if (authEnabled) {
    firebase.auth().onAuthStateChanged((user) => {
      updateAuthUI(user);
      // Clear anonymous localStorage when signing in/out
      localStorage.removeItem(ANON_STORAGE_KEY);
      if (user) refresh();
    });

    loginForm?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        clearError();
        const email = emailInput.value;
        const pass = passwordInput.value;
        await firebase.auth().signInWithEmailAndPassword(email, pass);
      } catch (err) {
        showError(err.message || String(err));
      }
    });

    signUpBtn?.addEventListener("click", async () => {
      try {
        clearError();
        const email = emailInput.value;
        const pass = passwordInput.value;
        await firebase.auth().createUserWithEmailAndPassword(email, pass);
      } catch (err) {
        showError(err.message || String(err));
      }
    });

    signOutBtn?.addEventListener("click", async () => {
      try {
        await firebase.auth().signOut();
        state.todos = [];
        render();
      } catch (err) {
        showError(err.message || String(err));
      }
    });
  } else {
    updateAuthUI(null);
  }

  refresh();
});
