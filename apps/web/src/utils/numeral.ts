// Chromium renders native <input type="number"> digits using Eastern Arabic
// numerals (٠١٢٣...) whenever an Arabic keyboard layout is active, regardless
// of the page's own language — it's tied to the OS/browser input locale, not
// our i18n setting, so it can show up even while the app itself is in
// English. Switching these fields to type="text" (see the inputs that use
// this helper) stops the browser from doing that, but if the person is
// actually typing on an Arabic keyboard the *characters themselves* can still
// come in as ٠-٩ (or the Persian ۰-۹ variants). This converts those back to
// plain 0-9 so numeric parsing (parseFloat/parseInt) keeps working either way.
const EASTERN_ARABIC_DIGITS: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

export function normalizeDigits(value: string): string {
    return value.replace(/[٠-٩۰-۹]/g, (digit) => EASTERN_ARABIC_DIGITS[digit] ?? digit);
}
