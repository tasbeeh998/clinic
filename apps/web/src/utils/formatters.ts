import { useTranslation } from 'react-i18next';

/**
 * Format money values with locale-aware formatting
 * Preserves decimal precision for display purposes
 */
export function formatMoney(amount: number | string | null | undefined, currencySymbol?: string): string {
  if (amount === null || amount === undefined) return '—';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '—';
  
  // Preserve the original decimal precision for display
  // Use toFixed(3) as the business uses 3 decimal places
  return `${numAmount.toFixed(3)} ${currencySymbol || 'KD'}`;
}

/**
 * Format money for table display with consistent tabular numerals
 */
export function formatMoneyTabular(amount: number | string | null | undefined, currencySymbol?: string): string {
  if (amount === null || amount === undefined) return '—';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '—';
  
  return `${numAmount.toFixed(3)} ${currencySymbol || 'KD'}`;
}

/**
 * Hook for formatted money with current language currency
 */
export function useMoneyFormatter() {
  const { t } = useTranslation();
  return (amount: number | string | null | undefined) => formatMoney(amount, t('common.currency'));
}

/**
 * Get status configuration for display
 */
export function getStatusConfig(status: string, t: (key: string) => string) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    // Invoice statuses
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('invoices.statusDraft') },
    ISSUED: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('invoices.statusIssued') },
    VOID: { bg: 'bg-red-100', text: 'text-red-700', label: t('invoices.statusVoid') },
    
    // Payment statuses
    UNPAID: { bg: 'bg-red-100', text: 'text-red-700', label: t('invoices.unpaid') },
    PARTIALLY_PAID: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('invoices.partiallyPaid') },
    PAID: { bg: 'bg-green-100', text: 'text-green-700', label: t('invoices.paidInFull') },
    
    // Appointment statuses
    BOOKED: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('appointments.statusBooked') },
    CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', label: t('appointments.statusConfirmed') },
    DONE: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('appointments.statusDone') },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: t('appointments.statusCancelled') },
    NO_SHOW: { bg: 'bg-orange-100', text: 'text-orange-700', label: t('appointments.statusNoShow') },
    
    // Active/Inactive
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: t('common.active') },
    INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('common.archived') },
  };
  
  return configs[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
}
