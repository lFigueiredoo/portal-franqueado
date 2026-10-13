import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  { ignores: ['.next/**','node_modules/**','supabase/functions/**','prototype-*.html'] },
  ...compat.extends('next/core-web-vitals','next/typescript').map(config => ({
    ...config,
    files: ['**/*.{js,jsx,ts,tsx}'],
  })),
]
