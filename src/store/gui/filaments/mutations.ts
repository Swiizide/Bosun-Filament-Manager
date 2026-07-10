import { MutationTree } from 'vuex'
import { GuiFilamentsState, GuiFilamentsStateEntry, GuiFilamentsStatePreset } from '@/store/gui/filaments/types'
import { getDefaultState } from '@/store/gui/filaments/index'

export const mutations: MutationTree<GuiFilamentsState> = {
    // replaces the entire filaments dictionary
    setFilaments(state, filaments: { [key: string]: GuiFilamentsStateEntry }) {
        state.filaments = filaments
    },

    // adds or updates a single filament
    setFilament(state, filament: GuiFilamentsStateEntry) {
        state.filaments = {
            ...state.filaments,
            [filament.id]: filament,
        }
    },

    // removes a single filament by id
    removeFilament(state, id: string) {
        const filaments = { ...state.filaments }
        delete filaments[id]
        state.filaments = filaments
    },

    // sets which filament is active
    setActiveFilamentId(state, id: string | null) {
        state.activeFilamentId = id
    },

    // resets everything back to default
    resetFilaments(state) {
        Object.assign(state, getDefaultState())
    },

    // adds or updates a preset
    setPreset(state, preset: GuiFilamentsStatePreset) {
        state.presets = {
            ...state.presets,
            [preset.id]: preset,
        }
    },

    // removes a preset by id
    removePreset(state, id: string) {
        const presets = { ...state.presets }
        delete presets[id]
        state.presets = presets
    },
}