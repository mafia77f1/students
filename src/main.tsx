import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import App from "./App.tsx";
import "./index.css";

if (Capacitor.isNativePlatform()) {
  Keyboard.setResizeMode({ mode: "body" }).catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(<App />);
