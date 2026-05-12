import path from "path";
const __dirname = import.meta.dirname;

export default function render(file) {
  return path.join(__dirname, "views", `${file}`);
}
