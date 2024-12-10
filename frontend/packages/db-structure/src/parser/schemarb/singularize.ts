// ref: https://github.com/rails/rails/blob/v8.0.0/activesupport/lib/active_support/inflections.rb#L35-L61
const rules = [
  [/(s)$/i, ''],
  [/(ss)$/i, '$1'],
  [/(n)ews$/i, '$1ews'],
  [/([ti])a$/i, '$1um'],
  [
    /((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)(sis|ses)$/i,
    '$1sis',
  ],
  [/^(analy)(sis|ses)$/i, '$1sis'],
  [/([^f])ves$/i, '$1fe'],
  [/(hive)s$/i, '$1'],
  [/(tive)s$/i, '$1'],
  [/([lr])ves$/i, '$1f'],
  [/([^aeiouy]|qu)ies$/i, '$1y'],
  [/(s)eries$/i, '$1eries'],
  [/(m)ovies$/i, '$1ovie'],
  [/(x|ch|ss|sh)es$/i, '$1'],
  [/^(m|l)ice$/i, '$1ouse'],
  [/(bus)(es)?$/i, '$1'],
  [/(o)es$/i, '$1'],
  [/(shoe)s$/i, '$1'],
  [/(cris|test)(is|es)$/i, '$1is'],
  [/^(a)x[ie]s$/i, '$1xis'],
  [/(octop|vir)(us|i)$/i, '$1us'],
  [/(alias|status)(es)?$/i, '$1'],
  [/^(ox)en/i, '$1'],
  [/(vert|ind)ices$/i, '$1ex'],
  [/(matr)ices$/i, '$1ix'],
  [/(quiz)zes$/i, '$1'],
  [/(database)s$/i, '$1'],
] as const

export const singularize = (word: string): string => {
  for (let i = rules.length - 1; i >= 0; i--) {
    const rule = rules[i]
    if (rule) {
      const [regex, replacement] = rule
      if (regex.test(word)) {
        return word.replace(regex, replacement)
      }
    }
  }

  return word
}
