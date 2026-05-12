// Imports
import express from "express";
import route from "./routes/route.js";

// Declaration && Initialization
const app = express();
const PORT = 3000;

// Middlewares

// JSON parser (keep after logger so parse errors can still be correlated with req.id)
app.use(express.json());

// serve static assets (css/js) from the views folder
app.use(express.static("views"));

app.use("/", route);

// listen to the port
app.listen(PORT, () => {
  console.log(`Server running in port ${PORT}`);
});
