/**
 * Feriados Nacionais Brasileiros
 * Inclui feriados fixos e calculados (Páscoa, Carnaval, Corpus Christi)
 */

// Calcula a data da Páscoa (Algoritmo de Meeus/Jones/Butcher)
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toYMD(date: Date): string {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}

export interface Holiday {
  date: string;  // YYYY-MM-DD
  name: string;
}

/**
 * Retorna todos os feriados nacionais de um ano
 */
export function getNationalHolidays(year: number): Holiday[] {
  const easter = easterDate(year);

  const holidays: Holiday[] = [
    // Feriados fixos
    { date: `${year}-01-01`, name: 'Confraternização Universal' },
    { date: `${year}-04-21`, name: 'Tiradentes' },
    { date: `${year}-05-01`, name: 'Dia do Trabalho' },
    { date: `${year}-09-07`, name: 'Independência do Brasil' },
    { date: `${year}-10-12`, name: 'N. Sra. Aparecida' },
    { date: `${year}-11-02`, name: 'Finados' },
    { date: `${year}-11-15`, name: 'Proclamação da República' },
    { date: `${year}-11-20`, name: 'Dia da Consciência Negra' },
    { date: `${year}-12-25`, name: 'Natal' },

    // Feriados calculados (baseados na Páscoa)
    { date: toYMD(addDays(easter, -48)), name: 'Segunda de Carnaval' },
    { date: toYMD(addDays(easter, -47)), name: 'Terça de Carnaval' },
    { date: toYMD(addDays(easter, -2)), name: 'Sexta-feira Santa' },
    { date: toYMD(easter), name: 'Páscoa' },
    { date: toYMD(addDays(easter, 60)), name: 'Corpus Christi' },
  ];

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Verifica se uma data (YYYY-MM-DD) é feriado nacional
 */
export function isNationalHoliday(dateStr: string): Holiday | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.substring(0, 4));
  if (isNaN(year)) return null;
  const holidays = getNationalHolidays(year);
  return holidays.find(h => h.date === dateStr) || null;
}

/**
 * Retorna mapa de feriados para lookup rápido
 */
export function getHolidayMap(year: number): Map<string, string> {
  const map = new Map<string, string>();
  getNationalHolidays(year).forEach(h => map.set(h.date, h.name));
  return map;
}
