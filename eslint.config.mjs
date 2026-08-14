import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/**
 * eslint-config-next 16 ships native flat configs on its subpath exports, so
 * these are spread directly. Do NOT route them through @eslint/eslintrc's
 * FlatCompat — under ESLint 10 that hits a circular reference while validating
 * the legacy schema and dies before linting a single file.
 */
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'supabase/**',
      'next-env.d.ts',
      'scripts/**',
    ],
  },
]

export default config
