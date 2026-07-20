const SAUDI_MOBILE_ERROR = 'يرجى إدخال رقم جوال سعودي صحيح';

/**
 * Normalize Saudi mobile numbers to E.164: +9665XXXXXXXX
 * Accepts: 05XXXXXXXX | 5XXXXXXXX | +9665XXXXXXXX | 009665XXXXXXXX
 */
export function normalizeSaudiPhone(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');

  let national: string | null = null;

  if (digits.startsWith('966') && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.startsWith('00966') && digits.length === 14) {
    national = digits.slice(5);
  } else if (digits.startsWith('05') && digits.length === 10) {
    national = digits.slice(1);
  } else if (digits.startsWith('5') && digits.length === 9) {
    national = digits;
  }

  if (!national || !/^5\d{8}$/.test(national)) {
    return null;
  }

  return `+966${national}`;
}

export function isValidSaudiPhone(input: string): boolean {
  return normalizeSaudiPhone(input) !== null;
}

export function getSaudiPhoneErrorMessage(): string {
  return SAUDI_MOBILE_ERROR;
}

/** Display-friendly local format: 05XXXXXXXX */
export function formatPhoneDisplay(phoneE164: string): string {
  const normalized = normalizeSaudiPhone(phoneE164) || phoneE164;
  if (normalized.startsWith('+966') && normalized.length === 13) {
    return `0${normalized.slice(4)}`;
  }
  return phoneE164;
}

/** Mask middle digits for shared kiosk confirmation screens */
export function maskPhone(phoneE164: string): string {
  const display = formatPhoneDisplay(phoneE164);
  if (display.length < 8) return '••••••••••';
  const start = display.slice(0, 3);
  const end = display.slice(-3);
  return `${start}${'•'.repeat(Math.max(display.length - 6, 4))}${end}`;
}
