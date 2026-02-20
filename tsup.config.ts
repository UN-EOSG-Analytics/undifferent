import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "un-fetcher/index": "src/un-fetcher/index.ts",
    "react/index": "src/react/index.tsx",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  tsconfig: "tsconfig.lib.json",
  external: ["react", "react-dom"],
});
