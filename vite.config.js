import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// Every top-level .html file is a page. Add new pages to this list.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        404: fileURLToPath(new URL("./404.html", import.meta.url)),
        about: fileURLToPath(new URL("./about.html", import.meta.url)),
        admin: fileURLToPath(new URL("./admin.html", import.meta.url)),
        coach: fileURLToPath(new URL("./coach.html", import.meta.url)),
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        lifter: fileURLToPath(new URL("./lifter.html", import.meta.url)),
        login: fileURLToPath(new URL("./login.html", import.meta.url)),
        pricing: fileURLToPath(new URL("./pricing.html", import.meta.url)),
        resources: fileURLToPath(new URL("./resources.html", import.meta.url)),
        session: fileURLToPath(new URL("./session.html", import.meta.url)),
        signup: fileURLToPath(new URL("./signup.html", import.meta.url)),
      },
    },
  },
});
