import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistance, formatRelative } from 'date-fns';
import { ru } from 'date-fns/locale';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date
export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: ru });
}

// Relative time
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true, locale: ru });
}

// Toxicity color
export function getToxicityColor(toxicity: number): string {
  if (toxicity < 30) return 'text-green-400';
  if (toxicity < 60) return 'text-yellow-400';
  return 'text-red-400';
}

// Toxicity label
export function getToxicityLabel(toxicity: number): string {
  if (toxicity < 20) return 'Здоровые отношения';
  if (toxicity < 40) return 'Легкая напряженность';
  if (toxicity < 60) return 'Умеренная токсичность';
  if (toxicity < 80) return 'Высокая токсичность';
  return 'Критическая токсичность';
}

// Truncate text
export function truncate(str: string, length: number = 100): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// Download as file
export function downloadAsFile(content: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// Get attachment style color
export function getAttachmentStyleColor(style: string): string {
  const styles: Record<string, string> = {
    secure: 'text-green-400',
    anxious: 'text-yellow-400',
    avoidant: 'text-orange-400',
    fearful: 'text-red-400',
  };
  return styles[style.toLowerCase()] || 'text-gray-400';
}

// Get attachment style label (Russian)
export function getAttachmentStyleLabel(style: string): string {
  const labels: Record<string, string> = {
    secure: 'Надежная привязанность',
    anxious: 'Тревожная привязанность',
    avoidant: 'Избегающая привязанность',
    fearful: 'Дезорганизованная привязанность',
  };
  return labels[style.toLowerCase()] || style;
}

// Price formatter
export function formatPrice(amount: number): string {
  return `${amount / 100}₽`;
}

// Validate email
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Sleep helper
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}