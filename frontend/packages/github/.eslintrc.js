module.exports = {
  overrides: [
    {
      files: ['src/api.server.ts'],
      rules: {
        '@typescript-eslint/require-await': 'off',
      },
    },
  ],
}
