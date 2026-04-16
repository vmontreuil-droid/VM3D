/**
 * Genereer een Belgische gestructureerde mededeling (OGM)
 * Format: +++NNN/NNNN/NNNCC+++
 * - 10 cijfers referentie (op basis van factuur ID)
 * - 2 controle cijfers (modulo 97, 0 wordt 97)
 */
export function generateOGM(factuurId: number): string {
  // Pad het factuur ID tot 10 cijfers
  const ref = String(factuurId).padStart(10, '0')
  // Modulo 97 controle
  const mod = Number(ref) % 97
  const check = mod === 0 ? 97 : mod
  const checkStr = String(check).padStart(2, '0')
  const full = ref + checkStr
  // Format: +++NNN/NNNN/NNNCC+++
  return `+++${full.slice(0, 3)}/${full.slice(3, 7)}/${full.slice(7, 12)}+++`
}

/**
 * Parse en valideer een OGM mededeling
 * Geeft true terug als het een geldige OGM is
 */
export function validateOGM(ogm: string): boolean {
  const cleaned = ogm.replace(/[^0-9]/g, '')
  if (cleaned.length !== 12) return false
  const ref = cleaned.slice(0, 10)
  const check = Number(cleaned.slice(10, 12))
  const mod = Number(ref) % 97
  const expected = mod === 0 ? 97 : mod
  return check === expected
}
