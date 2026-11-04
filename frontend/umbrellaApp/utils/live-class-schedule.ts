export type LiveClassScheduleFields = {
  date: string;
  startTime: string;
  endTime: string;
};

export type LiveClassScheduleResult =
  | { ok: true; startTime: string; endTime: string }
  | { ok: false; message: string };

function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? { day, month, year } : null;
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, hours, minutes] = match.map(Number);
  return hours < 24 && minutes < 60 ? { hours, minutes } : null;
}

function toLocalIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export function buildLiveClassSchedule(
  { date, startTime, endTime }: LiveClassScheduleFields,
  now: Date = new Date(),
): LiveClassScheduleResult {
  const day = parseDate(date);
  if (!day) return { ok: false, message: 'Informe a data no formato DD/MM/AAAA.' };

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (!start || !end) return { ok: false, message: 'Informe os horários no formato HH:MM.' };

  const startDate = new Date(day.year, day.month - 1, day.day, start.hours, start.minutes);
  const endDate = new Date(day.year, day.month - 1, day.day, end.hours, end.minutes);

  if (endDate <= startDate) return { ok: false, message: 'O horário final deve ser depois do inicial.' };
  if (startDate <= now) return { ok: false, message: 'Escolha uma data e horário futuros.' };

  return { ok: true, startTime: toLocalIso(startDate), endTime: toLocalIso(endDate) };
}
