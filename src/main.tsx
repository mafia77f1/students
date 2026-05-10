import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const markEditingState = () => {
  const active = document.activeElement;
  const isTextField = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
  document.body.classList.toggle("keyboard-active", isTextField);
};

window.addEventListener("focusin", markEditingState);
window.addEventListener("focusout", () => window.setTimeout(markEditingState, 80));

createRoot(document.getElementById("root")!).render(<App />);
