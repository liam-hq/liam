# Biome Plugins

## no-non-english-text

This plugin detects and prohibits non-English natural language in code comments and string literals.

### Configuration

The plugin is enabled by adding it to the plugins array in biome.jsonc:

```json
{
  "plugins": ["./frontend/internal-packages/configs/biome-plugins/no-non-english-text.grit"]
}
```

### Supported Languages Detection

The plugin detects the following non-English scripts:

- Japanese (Hiragana: U+3040-U+309F, Katakana: U+30A0-U+30FF, Kanji: U+4E00-U+9FAF)
- Chinese (CJK Unified Ideographs: U+4E00-U+9FFF)
- Korean (Hangul Syllables: U+AC00-U+D7AF)
- Russian (Cyrillic: U+0400-U+04FF)
- Hebrew (Hebrew: U+0590-U+05FF)
- Arabic (Arabic: U+0600-U+06FF, Arabic Supplement: U+0750-U+077F)

### Usage

The plugin will automatically detect non-English text in:
- Single-line comments (`//`)
- Multi-line comments (`/* */`)
- String literals (`"..."`, `'...'`, `` `...` ``)

### Examples

```typescript
// ❌ This will trigger the rule
// これはテストです (Japanese comment)
const message = "こんにちは"; // Japanese string

// ✅ This is fine
// This is an English comment
const message = "Hello World";
```

### Testing

Test files are provided in the `test-files/` directory:
- `test-japanese.ts` - Contains Japanese text (should trigger errors)
- `test-chinese.ts` - Contains Chinese text (should trigger errors)
- `test-korean.ts` - Contains Korean text (should trigger errors)
- `test-english-only.ts` - Contains only English text (should pass)

Run `pnpm lint` to test the plugin against these files.
