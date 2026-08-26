import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Не наш код, а служебное. Без этих строк `npm run lint` выдавал 10 264 проблемы,
    // из них 333 файла — из .claude: worktrees агентов и минифицированные бандлы
    // плагинов. Настоящие ошибки в src/ в такой куче не видно, и проверка,
    // на которую нельзя посмотреть, не работает вовсе.
    ".claude/**",
    "data/**",
    "supabase/.temp/**",
    "supabase/.branches/**",
  ]),
]);

export default eslintConfig;
