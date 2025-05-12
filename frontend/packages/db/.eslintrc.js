module.exports = {
  overrides: [
    {
      files: ['supabase/database.types.ts'],
      rules: {
        '@typescript-eslint/no-redundant-type-constituents': 'off',
      },
    },
  ],
}
