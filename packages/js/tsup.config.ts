import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/departements.ts", "src/communes.ts", "src/arrondissements.ts", "src/poles.ts"],
  format: ["esm", "cjs"],
  dts: true,
  target: "es2022",
  clean: true,
  minify: true,
  splitting: true,
  treeshake: true,
});
