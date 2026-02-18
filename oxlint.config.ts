import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "import", "unicorn"],
  categories: {
    correctness: "error",
    suspicious: "warn",
    pedantic: "off",
    perf: "warn",
    style: "off",
    restriction: "off",
  },
  rules: {
    // TypeScript
    "typescript/no-explicit-any": "warn",
    "typescript/no-non-null-assertion": "warn",

    // Import
    "import/no-cycle": "error",
    "import/no-self-import": "error",
    "import/no-duplicates": "error",
    "import/no-unassigned-import": "off",

    // Disable rules that conflict with oxfmt formatting
    "no-extra-semi": "off",
    "no-mixed-spaces-and-tabs": "off",
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
      plugins: ["vitest"],
      rules: {
        "typescript/no-explicit-any": "off",
      },
    },
    {
      files: ["**/*.vue"],
      plugins: ["vue"],
    },
  ],
});
