export function sanitizeLatexString(input) {
  if (!input || typeof input !== "string") return input;

  let output = input;

  // Escape percent signs not already escaped
  output = output.replace(/(?<!\\)%/g, "\\%");

  // Escape dollar signs for currency
  output = output.replace(/\$([0-9])/g, "\\$$1");

  // Fix common mixed fraction like 1\frac{1}{2} -> 1\,\frac{1}{2}
  output = output.replace(/(\d)\\frac/g, (_, d) => `${d}\\,\\frac`);

  // Fix malformed inline math (e.g., \\(1\\frac{1}{4}\\%) → \\(1\,\\frac{1}{4}\\%\\))
  output = output.replace(/\\\(([^)]*?)\\%\)/g, (_, expr) => {
    const fixedExpr = expr
      .replace(/(\d)\\frac/, (_, d) => `${d}\\,\\frac`)
      .replace(/(?<!\\)%/g, "\\%");
    return `\\(${fixedExpr}\\)`;
  });

  return output;
}
