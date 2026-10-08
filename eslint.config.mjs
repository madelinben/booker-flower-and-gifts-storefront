import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '.wrangler', 'node_modules', 'src/routeTree.gen.ts', '.tanstack'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: { console: 'readonly', process: 'readonly' } } },
  {
    rules: {
      // Barrel files are banned (no-barrels.mdc); layer imports are reviewed against layers.mdc.
      'no-restricted-syntax': ['error', { selector: 'ExportAllDeclaration', message: 'No barrel re-exports (no-barrels.mdc).' }],
    },
  },
);
