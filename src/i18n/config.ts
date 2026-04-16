export const locales = ['nl', 'fr', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'nl'
export const COOKIE_NAME = 'locale'
