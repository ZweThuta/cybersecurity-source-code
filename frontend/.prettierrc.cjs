/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */

const config = {
  semi: true, // Always use semicolons
  singleQuote: true, // Prefer single quotes
  trailingComma: "all", // Trailing commas wherever possible (better diffs)
  tabWidth: 2, // 2 spaces = standard for JS/TS
  useTabs: false, // Indent with spaces, not tabs
  printWidth: 100, // Slightly wider line length (easier with modern monitors)
  bracketSpacing: true, // { foo: bar } instead of {foo: bar}
  bracketSameLine: false, // Put > of JSX on its own line
  arrowParens: "always", // Always include parens (x) => x
  jsxSingleQuote: false, // Keep JSX props with double quotes <Button type="button" />
  endOfLine: "lf", // Consistent line endings across OS
  quoteProps: "as-needed", // Only add quotes around object props when required
  proseWrap: "preserve", // Don’t force markdown text wrapping
  htmlWhitespaceSensitivity: "css", // Respect CSS display property for HTML
};

module.exports = config;
