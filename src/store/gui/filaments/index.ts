import { Module } from 'vuex'
import { getters } from '@/store/gui/filaments/getters'
import { actions } from '@/store/gui/filaments/actions'
import { mutations } from '@/store/gui/filaments/mutations'
import { GuiFilamentsState } from '@/store/gui/filaments/types'
import { RootState } from '@/store/types'

export const getDefaultState = (): GuiFilamentsState => {
    return {
        activeFilamentId: null,
        filaments: {},
        presets: {},
    }
}

const state = getDefaultState()

export const filaments: Module<GuiFilamentsState, RootState> = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}