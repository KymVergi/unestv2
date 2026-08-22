import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Flat config. `next lint` was removed in Next 16, so ESLint runs directly.
 * Deliberately built on typescript-eslint rather than eslint-config-next: far
 * fewer packages and no coupling to the framework's release cycle.
 */
export default tseslint.config(
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'out/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // v7 exposes the flat-config variants under `configs.flat`.
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        React: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        IntersectionObserver: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
);
