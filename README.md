Welcome to Express StudyJam — Routes, Views & Todo App

This repository contains the materials used in a StudyJam that demonstrates how a small Express backend can serve a vanilla JavaScript front-end. The project is a compact Todo application used to teach routing, CRUD operations, and DOM-driven UI updates.

---

## 📂 Repository Structure

Explore the key files and folders below.

|                  |                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| **Use this if:** | You want a minimal, hands-on example of Express routes connected to a front-end without frameworks. |
| **Contains:**    | Server entry, route handlers, and the `views` folder that holds the client app.                     |

### Important paths

- `app.js` — server bootstrap and middleware registration.
- `routes/route.js` — CRUD routes for the Todo API and the root route serving the app.
- `views/` — frontend: `index.html`, `index.css`, `index.js` (UI, layout, client logic).
- `render.js` — helper to resolve view files for responses.
- `todo.json` — file-based storage used for demo persistence.

---

## 🔧 Technologies

| Technology        | Purpose                                 |
| ----------------- | --------------------------------------- |
| Node.js + Express | Server and route handling               |
| HTML / CSS        | Frontend markup and styling             |
| JavaScript (ES6)  | Frontend logic, state and `fetch` calls |

---

## 🚀 Quick start

1. Clone or download this repository.
2. Install dependencies (if present) and start the server:

```bash
npm install
node app.js
# or use the project's start script when available:
npm start
```

3. Open `http://localhost:3000` (or the port logged by the server).

Tips: edit `views/index.js` to experiment with client behaviour; update `routes/route.js` to practice server-side logic.

---

## 🔁 API Endpoints (Demo)

- `GET /todos` — list all todos
- `POST /todos` — create `{ task: string }`
- `GET /todos/:id` — get a single todo
- `PATCH /todos/:id` — update `{ task?, done? }`
- `DELETE /todos/:id` — remove a todo

Use `curl`, Postman, or the app UI to interact with these endpoints.

---

## 🎯 Learning Outcomes

- Map Express routes to frontend actions using `fetch`.
- Implement and test CRUD behavior in a tiny app.
- Practice DOM manipulation and lightweight state handling without libraries.

---

## ✏️ Activities & Challenges

| Activity          | Description                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| **Main app**      | Inspect `views/index.html` + `views/index.js` to see how the UI uses the API.         |
| **Hands-on**      | Replace `todo.json` with a small DB (lowdb/SQLite) and persist todos across restarts. |
| **Accessibility** | Improve keyboard navigation and ARIA roles in the UI.                                 |

Suggested exercises:

- Add a `/stats` route that returns counts (active/total/done).
- Add per-user todo lists (no auth required — simulate users by query param).

---

## 🤝 Contributing

Contributions and improvements are welcome. Please open a focused PR and document any new scripts or commands in this README.

---

## ❤️ Credits

<div align="center">

Made for teaching and demos by the GDG PUP Web Dev Team.

Happy coding! 🚀

</div>
