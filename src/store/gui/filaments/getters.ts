import { GetterTree } from 'vuex'
import { GuiFilamentsState, GuiFilamentsStateEntry, GuiFilamentsStatePreset } from '@/store/gui/filaments/types'
import { RootState } from '@/store/types'

export const getters: GetterTree<GuiFilamentsState, RootState> = {
    // returns all filaments as an array
    getAllFilaments(state): GuiFilamentsStateEntry[] {
        return Object.values(state.filaments)
    },

    // returns the active filament object, or null if none selected
    getActiveFilament(state): GuiFilamentsStateEntry | null {
        if (!state.activeFilamentId) return null
        return state.filaments[state.activeFilamentId] ?? null
    },

    getAllPresets(state): GuiFilamentsStatePreset[] {
        return Object.values(state.presets)
    },
}