import { VacationOption } from './vacation-optimizer';

function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function formatReadableRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
}

function generateUid(option: VacationOption): string {
  return `${option.startDate}-${option.endDate}@smart-vacation-planner`;
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.substring(0, 75)];
  let i = 75;
  while (i < line.length) {
    parts.push(' ' + line.substring(i, i + 74));
    i += 74;
  }
  return parts.join('\r\n');
}

export function generateIcs(vacations: VacationOption[]): string {
  const now = new Date();
  const timestamp =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0') +
    'T' +
    String(now.getUTCHours()).padStart(2, '0') +
    String(now.getUTCMinutes()).padStart(2, '0') +
    String(now.getUTCSeconds()).padStart(2, '0') +
    'Z';

  const events = vacations.map(v => {
    const holidays = v.holidaysIncluded.map(h => escapeIcsText(h.name)).join('\\, ');
    const description = [
      `PTO days used: ${v.ptoDaysUsed}`,
      `Total rest days: ${v.totalRestDays}`,
      `Efficiency: ${v.efficiency}x`,
      holidays ? `Public holidays: ${holidays}` : '',
    ]
      .filter(Boolean)
      .join('\\n');

    return [
      'BEGIN:VEVENT',
      `UID:${generateUid(v)}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${formatIcsDate(v.startDate)}`,
      `DTEND;VALUE=DATE:${addOneDay(v.endDate)}`,
      foldLine(`SUMMARY:Vacation: ${formatReadableRange(v.startDate, v.endDate)}`),
      foldLine(`DESCRIPTION:${description}`),
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart Vacation Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function downloadIcs(content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vacation-plan.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
