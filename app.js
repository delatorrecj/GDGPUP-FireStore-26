// Imports
import express from "express";
import route from "./routes/route.js";
import { initializeApp, cert } from "firebase-admin/app";
import fs from "fs";

// Declaration && Initialization
const app = express();
const PORT = 3000;

// Load the service account key
const serviceAccount = JSON.parse(
  fs.readFileSync(
    new URL("./sj-6-firestore-firebase-adminsdk-fbsvc-61e29fa849.json"),
  ),
);

// Initialize the firebase admin sdk
initializeApp({
  credential: cert(serviceAccount),
});

app.use(express.json());
app.use(express.static("views"));
app.use("/", route);

// listen to the port
app.listen(PORT, () => {
  console.log(`Server running in port ${PORT}`);
});

// Export db so it can be used in routes
export const db = getFirestore();
export const todosRef = db.collection("todos");
