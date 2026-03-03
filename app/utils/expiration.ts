import { Protein } from '@prisma/client'

// Expiration days for each protein type
export const PROTEIN_EXPIRATION_DAYS: Record<string, number> = {
  CHICKEN_BREAST: 4,
  CHICKEN_THIGHS: 4,
  ROTISSERIE_CHICKEN: 4,
  GROUND_BEEF: 5,
  PORK_BUTT: 5,
  FISH: 3,
  EGGS: 7,
}

export function getExpirationDate(cookedAt: Date, protein: Protein | null): Date {
  const days = protein ? PROTEIN_EXPIRATION_DAYS[protein] || 7 : 7 // Default to 7 days if no protein
  const expirationDate = new Date(cookedAt)
  expirationDate.setDate(expirationDate.getDate() + days)
  return expirationDate
}

export function getDaysUntilExpiration(cookedAt: Date, protein: Protein | null): number {
  const expirationDate = getExpirationDate(cookedAt, protein)
  const now = new Date()
  const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return daysLeft
}

export function getExpirationStatus(daysLeft: number): 'fresh' | 'expiring-soon' | 'expired' {
  if (daysLeft <= 0) return 'expired'
  if (daysLeft <= 1) return 'expiring-soon'
  return 'fresh'
}
