import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date string or Date to DD/MM/YYYY (UK format).
 * Returns '—' for null/invalid values.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(d)) return '—';
  return format(d, 'dd/MM/yyyy');
}

/**
 * Format a date string to a short human-readable form: "Wed 26 Mar"
 */
export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(d)) return '—';
  return format(d, 'EEE d MMM');
}

/**
 * Format a date with time: "26/03/2026 14:30"
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(d)) return '—';
  return format(d, 'dd/MM/yyyy HH:mm');
}

/**
 * Format currency in GBP
 */
export function formatGBP(value: number | string | null | undefined): string {
  if (value == null) return '£0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '£0';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
