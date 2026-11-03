import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// Two pages: the home page (index.html) and the camera tool (session.html).
// Add new pages here as the front end grows.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        session: fileURLToPath(new URL("./session.html", import.meta.url)),
      },
    },
  },
});