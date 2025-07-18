import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// Demo configuration for testing the widget
export default defineConfig({
  plugins: [react()],
  root: "./demo",
  build: {
    outDir: "../dist-demo",
  },
});
