import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "/var/www/sistema-ibanje/backend",
  format: "esm",
  splitting: true,
});
