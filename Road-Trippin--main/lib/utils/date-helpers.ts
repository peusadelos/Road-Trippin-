import { format, addDays, differenceInDays, parseISO } from 'date-fns';

export function generateDays(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = differenceInDays(end, start) + 1;

  return Array.from({ length: totalDays }, (_, i) => ({
    day_number: i + 1,
    date: format(addDays(start, i), 'yyyy-MM-dd'),
  }));
}

export function formatDayLabel(date: string, dayNumber: number): string {
  const parsed = parseISO(date);
  return `Day ${dayNumber} · ${format(parsed, 'MMM d')}`;
}

export function formatFullDate(date: string): string {
  return format(parseISO(date), 'MMMM d, yyyy');
}

export function getTripDuration(startDate: string, endDate: string): number {
  return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
}