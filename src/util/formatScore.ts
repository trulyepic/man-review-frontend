/**
 * Format a number string with customizable decimal precision.
 *
 * @param value         The number or string to format.
 * @param maxDecimals   Maximum number of decimal places (default: 4).
 * @returns             Formatted string (e.g., "7.7", "9.0", "8.1234").
 */
export function formatScore(
  value: number | string,
  maxDecimals: number = 4
): string {
  const str = String(value);

  if (!/^\d+(\.\d+)?$/.test(str)) return ""; // basic safety check

  const [intPart, decimalPart = ""] = str.split(".");

  if (decimalPart.length === 0) {
    return `${intPart}.0`; // ensure 1 decimal
  }

  // Trim trailing zeroes, then limit to maxDecimals
  const trimmedDecimals = decimalPart.replace(/0+$/, "").slice(0, maxDecimals);

  return trimmedDecimals.length > 0
    ? `${intPart}.${trimmedDecimals}`
    : `${intPart}.0`;
}
