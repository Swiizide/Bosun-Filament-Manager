const materialDensities: Record<string, number> = {
    'PLA': 1.24,
    'PLA+': 1.24,
    'PETG': 1.27,
    'PETG-CF': 1.30,
    'ABS': 1.05,
    'ASA': 1.07,
    'TPU': 1.21,
    'Nylon': 1.08,
    'PC': 1.20,
    'Custom': 1.24,
}

/**
 * Converts millimeters of filament used to grams
 * using material density and standard 1.75mm diameter
 */
export function filamentMmToGrams(mm: number, materialType: string): number {
    const radiusMm = 1.75 / 2
    const volumeMm3 = Math.PI * radiusMm * radiusMm * mm
    const volumeCm3 = volumeMm3 / 1000
    const density = materialDensities[materialType] ?? 1.24
    return Math.round(volumeCm3 * density * 100) / 100
}

/**
 * Calculates a new correction factor from actual vs estimated usage
 * Uses a rolling nudge rather than replacing outright
 */
export function calculateCorrectionFactor(
    oldFactor: number,
    actualUsedG: number,
    estimatedUsedG: number,
    measurementCount: number
): number {
    if (estimatedUsedG <= 0) return oldFactor
    const rawFactor = actualUsedG / estimatedUsedG
    const weight = Math.min(measurementCount / 10, 0.5)
    const newFactor = oldFactor * (1 - weight) + rawFactor * weight
    return Math.round(Math.min(Math.max(newFactor, 0.5), 2.0) * 1000) / 1000
}

/**
 * Generates a random 4-character alphanumeric roll ID
 * e.g. "A3B2", "X7K1"
 */
export function generateRollId(existingIds: string[]): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let id = ''
    let attempts = 0
    do {
        id = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        attempts++
    } while (existingIds.includes(id) && attempts < 1000)
    return id
}