import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "/var/www/sistema-ibanje/frontend",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  envDir: "frontend",
  resolve: {
    alias: {
      "components": path.resolve(__dirname, "./src/components"),
      "pages": path.resolve(__dirname, "./src/pages"),
      "types": path.resolve(__dirname, "./src/types"),
      "enums": path.resolve(__dirname, "./src/enums"),
      "routes": path.resolve(__dirname, "./src/routes"),
      "utils": path.resolve(__dirname, "./src/utils"),
      "hooks": path.resolve(__dirname, "./src/hooks")
    },
  },
});
