import type { Locale } from './config'
import type { Dictionary } from './nl'
import nl from './nl'
import fr from './fr'
import en from './en'

const dictionaries: Record<Locale, Dictionary> = { nl, fr, en }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.nl
}
