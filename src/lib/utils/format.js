import { format } from 'date-fns';

export function formatDateTime(input) {
  if (!input) return '—';
  try {
    return format(new Date(input), 'dd.MM.yyyy HH:mm');
  } catch (error) {
    return input;
  }
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}
