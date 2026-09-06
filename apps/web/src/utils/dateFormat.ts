// Centralized, language-aware date formatting
// its own copy of this hardcoded to 'ar-KW'. Having it in one place means
// adding a third language later only means editing this file.
export function formatDate(value: string | Date | null | undefined, language: string): string {
  if (!value) return '—';
  const locale = language === 'ar' ? 'ar-KW' : 'en-GB';
  return new Date(value).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDateTime(value: string | Date | null | undefined, language: string): string {
  if (!value) return '—';
  const locale = language === 'ar' ? 'ar-KW' : 'en-GB';
  return new Date(value).toLocaleString(locale, {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export function formatTime(value: string | Date | null | undefined, language: string): string {
  if (!value) return '—';
  const locale = language === 'ar' ? 'ar-KW' : 'en-GB';
  return new Date(value).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
