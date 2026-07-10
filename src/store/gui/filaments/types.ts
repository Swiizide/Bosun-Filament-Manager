export interface GuiFilamentsState {
    activeFilamentId: string | null
    filaments: {
        [key: string]: GuiFilamentsStateEntry
    }
    presets: {
        [key: string]: GuiFilamentsStatePreset
    }
}

export interface GuiFilamentsStateMeasurement {
    date: string
    remainingWeight: number
    actualUsedG: number
    estimatedUsedG: number
    correctionFactor: number
}

export interface GuiFilamentsStateEntry {
    id: string
    rollId: string
    brand: string
    type: string
    color: string
    loadTemp: number
    totalWeight: number
    spoolWeight: number
    remainingWeight: number
    correctionFactor: number
    warningThreshold: number
    measurements: GuiFilamentsStateMeasurement[]
    loadedAt: string | null
}

export interface GuiFilamentsStatePreset {
    id: string
    brand: string
    type: string
    color: string
    loadTemp: number
    filamentWeight: number
    spoolWeight: number
    correctionFactor: number
    warningThreshold: number
}

