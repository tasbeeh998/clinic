/**
 * Normalizes Arabic digits to their Latin equivalents.
 * This is useful for input fields where users might type Arabic numerals (٠١٢٣٤٥٦٧٨٩)
 * but the backend expects Latin numerals (0123456789).
 *
 * Example:
 *   normalizeDigits('١٢٣') → '123'
 *   normalizeDigits('123') → '123'
 *   normalizeDigits('١٢٣abc') → '123abc'
 */
export function normalizeDigits(input: string): string {
  const arabicDigitMap: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  };

  return input.replace(/[٠-٩]/g, (match) => arabicDigitMap[match] || match);
}
