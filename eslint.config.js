// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const URL_MESSAGE = 'Server URLs come from configuration (src/config/env.ts).';

module.exports = defineConfig([
  expoConfig,
  {
    // Web-only template files, and external-link.tsx which only they use, are kept untouched;
    // web is not a V1 target (docs/ARCHITECTURE.md §19).
    ignores: ['dist/*', '**/*.web.ts', '**/*.web.tsx', 'src/components/external-link.tsx'],
  },

  // Boundaries from docs/ENGINEERING_STANDARDS.md §2–§4. Each rule exempts only its owner.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/api/client.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Network calls go through src/api/client.ts only.' },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/config/env.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Configuration is read in src/config/env.ts only.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/config/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'Literal[value=/^https?:\\/\\//]', message: URL_MESSAGE },
        { selector: 'TemplateElement[value.raw=/^https?:\\/\\//]', message: URL_MESSAGE },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/features/auth/credential-store.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-secure-store',
              message: 'The token store is used only through src/features/auth/credential-store.ts.',
            },
          ],
        },
      ],
    },
  },
]);
