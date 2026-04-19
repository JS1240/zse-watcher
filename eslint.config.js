// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config({ ignores: ["dist/", "src/route-tree.gen.ts"] }, {
  files: ["src/**/*.{ts,tsx}"],
  extends: [
    ...tseslint.configs.recommended,
  ],
  plugins: {
    "react-hooks": reactHooks,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
  },
}, {
  // Storybook rules - only apply to .stories files, not the whole project
  files: ["src/**/*.stories.{ts,tsx}"],
  rules: {
    // Override: allow @storybook/react imports in stories (they use framework-agnostic types)
    "storybook/no-renderer-packages": "off",
  },
});
