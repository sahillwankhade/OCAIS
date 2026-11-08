import { SupportedLocale, Translations } from './types';
import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';

export const dictionaries: Record<SupportedLocale, Translations> = {
  en,
  hi,
  mr,
};

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export function getDictionary(locale?: string): Translations {
  if (locale === 'hi') return hi;
  if (locale === 'mr') return mr;
  return en;
}

export * from './types';

