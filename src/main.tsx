import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const markEditingState = () => {
  const active = document.activeElement;
  const isTextField = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
  document.body.classList.toggle("keyboard-active", isTextField);
};

const keepFocusedFieldVisible = () => {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    active.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }
};

window.addEventListener("focusin", () => {
  markEditingState();
  window.setTimeout(keepFocusedFieldVisible, 280);
});
window.addEventListener("focusout", () => window.setTimeout(markEditingState, 80));

createRoot(document.getElementById("root")!).render(<App />);
