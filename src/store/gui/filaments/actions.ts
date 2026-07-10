import { ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import { GuiFilamentsState, GuiFilamentsStateEntry, GuiFilamentsStatePreset } from '@/store/gui/filaments/types'
import { v4 as uuidv4 } from 'uuid'
import Vue from 'vue'
import { generateRollId } from '@/store/gui/filaments/helpers'

export const actions: ActionTree<GuiFilamentsState, RootState> = {
    // adds a new filament with a generated id
    addFilament({ commit, state }, filament: Omit<GuiFilamentsStateEntry, 'id' | 'rollId' | 'loadedAt'>) {
        const id = uuidv4()
        const existingRollIds = Object.values(state.filaments).map((f) => f.rollId)
        const rollId = generateRollId(existingRollIds)
        const entry: GuiFilamentsStateEntry = {
            ...filament,
            id,
            rollId,
            loadedAt: null,
            measurements: filament.measurements ?? [],
        }
        commit('setFilament', entry)
        Vue.$socket.emit('server.database.post_item', {
            namespace: 'mainsail',
            key: 'filaments.filaments.' + id,
            value: entry,
        })
    },

    // updates an existing filament
    updateFilament({ commit, state }, filament: GuiFilamentsStateEntry) {
        // generate rollId if this is an old entry that doesn't have one
        if (!filament.rollId) {
            const existingRollIds = Object.values(state.filaments)
                .filter((f) => f.id !== filament.id)
                .map((f) => f.rollId)
                .filter(Boolean)
            filament = { ...filament, rollId: generateRollId(existingRollIds) }
        }
        commit('setFilament', filament)
        Vue.$socket.emit('server.database.post_item', {
            namespace: 'mainsail',
            key: 'filaments.filaments.' + filament.id,
            value: filament,
        })
    },

    // deletes a filament by id
    deleteFilament({ commit }, id: string) {
        commit('removeFilament', id)
        Vue.$socket.emit('server.database.delete_item', {
            namespace: 'mainsail',
            key: 'filaments.filaments.' + id,
        })
    },

    // sets the active filament
    setActiveFilament({ commit, state }, id: string | null) {
        commit('setActiveFilamentId', id)
        Vue.$socket.emit('server.database.post_item', {
            namespace: 'mainsail',
            key: 'filaments.activeFilamentId',
            value: id,
        })
        // record load date on the filament
        if (id && state.filaments[id]) {
            const today = new Date().toISOString().split('T')[0]
            const updated = { ...state.filaments[id], loadedAt: today }
            commit('setFilament', updated)
            Vue.$socket.emit('server.database.post_item', {
                namespace: 'mainsail',
                key: 'filaments.filaments.' + id,
                value: updated,
            })
        }
    },

    // saves a filament as a preset
    addPreset({ commit }, preset: Omit<GuiFilamentsStatePreset, 'id'>) {
        const id = uuidv4()
        const entry: GuiFilamentsStatePreset = { ...preset, id }
        commit('setPreset', entry)
        Vue.$socket.emit('server.database.post_item', {
            namespace: 'mainsail',
            key: 'filaments.presets.' + id,
            value: entry,
        })
    },

    // deletes a preset by id
    deletePreset({ commit }, id: string) {
        commit('removePreset', id)
        Vue.$socket.emit('server.database.delete_item', {
            namespace: 'mainsail',
            key: 'filaments.presets.' + id,
        })
    },

    // updates an existing preset
    updatePreset({ commit }, preset: GuiFilamentsStatePreset) {
        commit('setPreset', preset)
        Vue.$socket.emit('server.database.post_item', {
            namespace: 'mainsail',
            key: 'filaments.presets.' + preset.id,
            value: preset,
        })
    },

    async logMeasurement(_, payload: {
        filamentId: string
        filamentName: string
        rollId: string
        loadedAt: string | null
        apiUrl: string
        measurement: any
    }) {
        try {
            const logPath = '/server/files/config/filament_log.txt'
            let existingContent = ''

            try {
                const response = await fetch(payload.apiUrl + logPath)
                if (response.ok) existingContent = await response.text()
            } catch {
                // file doesn't exist yet
            }

            const unloadDate = payload.measurement.date
            const loadDate = payload.loadedAt ?? unloadDate
            const usedG = payload.measurement.actualUsedG.toFixed(1)

            const newEntry =
                `${payload.filamentName} [${payload.rollId}] | ${usedG}g used | ${loadDate} → ${unloadDate}\n`

            const updatedContent = existingContent + newEntry

            const file = new File([updatedContent], 'filament_log.txt', { type: 'text/plain' })
            const formData = new FormData()
            formData.append('file', file)
            formData.append('root', 'config')

            await fetch(payload.apiUrl + '/server/files/upload', {
                method: 'POST',
                body: formData,
            })
        } catch (e) {
            console.error('Failed to write filament log', e)
        }
    },
}