import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for the Wireframe Agent frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In dev, forward API calls to the backend so the frontend can use
    // same-origin "/api/..." paths (matches how production is served).
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
