module.exports = {
  plugins: ['stylelint-no-unused-selectors'],
  rules: {
    'plugin/no-unused-selectors': [
      true,
      {
        resolveNestedSelectors: true,
        includePattern: ['**/*.module.css']
      }
    ]
  }
};
