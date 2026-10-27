import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'fatura-sync'] },
  tseslint.configs.recommended,
)
