<template>
    <panel
        :icon="mdiBasket"
        :title="$t('Panels.FilamentManager.Title')"
        :collapsible="true"
        card-class="filament-manager-panel">
        <v-card-text class="py-2">

            <!-- Active filament display -->
            <v-row align="center" class="mb-1">
                <v-col cols="auto" v-if="activeFilament">
                    <v-icon :color="activeFilament.color" small>{{ mdiCircle }}</v-icon>
                </v-col>
                <v-col>
                    <span class="text-caption text--secondary">Currently loaded</span>
                    <br />
                    <span v-if="activeFilament" class="font-weight-bold">
                        {{ activeFilament.brand }} {{ activeFilament.type }}
                        <span v-if="activeFilament.rollId" class="text-caption text--secondary ml-1">[{{ activeFilament.rollId }}]</span>
                        <span class="text-caption text--secondary ml-2">
                            {{ activeFilament.remainingWeight }}g remaining
                        </span>
                    </span>
                    <span v-else class="text--secondary text-caption">No filament selected</span>
                </v-col>
            </v-row>
            <v-row class="mb-2">
                <v-col>
                    <v-btn small color="primary" class="mr-1" @click="showLoadDialog = true">
                        <v-icon small left>{{ mdiTrayArrowDown }}</v-icon>
                        Load
                    </v-btn>
                    <v-btn
                        small
                        color="warning"
                        class="mr-1"
                        :disabled="!activeFilament"
                        @click="unloadFilament">
                        <v-icon small left>{{ mdiTrayArrowUp }}</v-icon>
                        Unload
                    </v-btn>
                    <v-btn
                        small
                        text
                        color="error"
                        :disabled="!activeFilament"
                        @click="clearActiveFilament">
                        Clear
                    </v-btn>
                </v-col>
            </v-row>

            <!-- Low filament warning -->
            <v-row v-if="activeFilament && isLow(activeFilament) && !dismissLowWarning">
                <v-col>
                    <v-alert
                        type="warning"
                        dense
                        text
                        dismissible
                        class="mb-2"
                        @input="dismissLowWarning = true">
                        Low filament on {{ activeFilament.brand }} {{ activeFilament.type }} —
                        only {{ activeFilament.remainingWeight }}g remaining!
                    </v-alert>
                </v-col>
            </v-row>

            <v-divider class="mb-3" />

            <!-- Filament list -->
            <v-row v-if="filaments.length === 0">
                <v-col class="text-center">
                    <p class="text--disabled">{{ $t('Panels.FilamentManager.NoFilaments') }}</p>
                </v-col>
            </v-row>

            <v-row
                v-for="filament in filaments"
                :key="filament.id"
                align="center">
                <v-col cols="auto" style="width: 32px">
                    <v-icon v-if="isActive(filament)" color="primary" small>
                        {{ mdiCheckCircle }}
                    </v-icon>
                    <v-icon v-else :color="filament.color" small>
                        {{ mdiCircle }}
                    </v-icon>
                </v-col>
                <v-col cols="auto" style="width: 24px">
                    <v-icon
                        v-if="isLow(filament)"
                        color="warning"
                        small
                        :title="`Low filament — ${filament.remainingWeight}g remaining`">
                        {{ mdiAlert }}
                    </v-icon>
                </v-col>
                <v-col>
                    <span class="font-weight-medium">{{ filament.brand }} {{ filament.type }}</span>
                    <span v-if="filament.rollId" class="text-caption text--secondary ml-1">[{{ filament.rollId }}]</span>
                    <br />
                    <span class="text-caption text--secondary">
                        {{ filament.remainingWeight }}g remaining of {{ filament.totalWeight }}g
                    </span>
                </v-col>
                <v-col cols="auto">
                    <v-btn icon small :title="'Refill ' + filament.brand" @click="refillFilament(filament)">
                        <v-icon small>{{ mdiRestart }}</v-icon>
                    </v-btn>
                    <v-btn icon small title="Save as preset" @click="saveAsPreset(filament)">
                        <v-icon small>{{ mdiContentSave }}</v-icon>
                    </v-btn>
                    <v-btn icon small @click="editFilament(filament)">
                        <v-icon small>{{ mdiPencil }}</v-icon>
                    </v-btn>
                    <v-btn icon small color="error" @click="confirmDelete(filament)">
                        <v-icon small>{{ mdiDelete }}</v-icon>
                    </v-btn>
                </v-col>
            </v-row>

            <v-divider v-if="filaments.length > 0" class="my-2" />

            <v-row>
                <v-col class="text-center">
                    <v-btn small color="primary" @click="openAddDialog">
                        Add Filament
                    </v-btn>
                </v-col>
            </v-row>
        </v-card-text>

        <!-- Load dialog -->
        <filament-load-dialog
            v-model="showLoadDialog"
            @load="onFilamentLoaded"
            @add-new="openAddDialog" />

        <!-- Add/Edit dialog -->
        <filament-manager-dialog
            v-model="showAddDialog"
            :edit-filament="selectedFilament"
            :prefilled-preset="prefilledPreset"
            @closed="selectedFilament = null" />

        <!-- Delete confirmation dialog -->
        <v-dialog v-model="showDeleteDialog" max-width="400px">
            <v-card>
                <v-card-title>Delete Filament?</v-card-title>
                <v-card-text v-if="filamentToDelete">
                    Are you sure you want to delete
                    <strong>{{ filamentToDelete.brand }} {{ filamentToDelete.type }}</strong>?
                    This cannot be undone.
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
                    <v-btn color="error" @click="deleteFilament">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Preset saved snackbar -->
        <v-snackbar v-model="showPresetSaved" timeout="2000" color="success" bottom>
            Saved as preset!
        </v-snackbar>

        <!-- G-code sent snackbar -->
        <v-snackbar v-model="showGcodeSent" timeout="3000" color="info" bottom>
            {{ gcodeMessage }}
        </v-snackbar>

        <!-- Weigh dialog — triggered by unload -->
        <filament-weigh-dialog
            v-model="showWeighDialog"
            :filament="unloadingFilament"
            :filament-used-mm="sessionEstimatedMm" />
    </panel>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import Panel from '@/components/ui/Panel.vue'
import FilamentManagerDialog from '@/components/panels/FilamentManager/FilamentManagerDialog.vue'
import FilamentLoadDialog from '@/components/panels/FilamentManager/FilamentLoadDialog.vue'
import FilamentWeighDialog from '@/components/panels/FilamentManager/FilamentWeighDialog.vue'
import { filamentMmToGrams } from '@/store/gui/filaments/helpers'
import {
    mdiBasket, mdiCircle, mdiCheckCircle, mdiPencil, mdiDelete,
    mdiRestart, mdiContentSave, mdiTrayArrowDown, mdiTrayArrowUp, mdiAlert
} from '@mdi/js'
import { GuiFilamentsStateEntry, GuiFilamentsStatePreset } from '@/store/gui/filaments/types'
import Vue from 'vue'

@Component({
    components: { Panel, FilamentManagerDialog, FilamentLoadDialog, FilamentWeighDialog },
})
export default class FilamentManagerPanel extends Mixins(BaseMixin) {
    mdiBasket = mdiBasket
    mdiCircle = mdiCircle
    mdiCheckCircle = mdiCheckCircle
    mdiPencil = mdiPencil
    mdiDelete = mdiDelete
    mdiRestart = mdiRestart
    mdiContentSave = mdiContentSave
    mdiTrayArrowDown = mdiTrayArrowDown
    mdiTrayArrowUp = mdiTrayArrowUp
    mdiAlert = mdiAlert

    showAddDialog = false
    showLoadDialog = false
    showDeleteDialog = false
    showPresetSaved = false
    showGcodeSent = false
    showWeighDialog = false
    gcodeMessage = ''
    dismissLowWarning = false

    // tracks cumulative filament used (in mm) since last load
    sessionEstimatedMm = 0
    // filament reference held during unload so weigh dialog has it after active is cleared
    unloadingFilament: GuiFilamentsStateEntry | null = null
    // filament_used value at the moment of loading, so we can diff it per session
    sessionStartFilamentMm = 0

    selectedFilament: GuiFilamentsStateEntry | null = null
    filamentToDelete: GuiFilamentsStateEntry | null = null
    prefilledPreset: Partial<GuiFilamentsStatePreset> | null = null

    get filaments(): GuiFilamentsStateEntry[] {
        return this.$store.getters['gui/filaments/getAllFilaments']
    }

    get activeFilament(): GuiFilamentsStateEntry | null {
        return this.$store.getters['gui/filaments/getActiveFilament']
    }

    isActive(filament: GuiFilamentsStateEntry): boolean {
        return this.$store.state.gui.filaments.activeFilamentId === filament.id
    }

    isLow(filament: GuiFilamentsStateEntry): boolean {
        return filament.remainingWeight <= (filament.warningThreshold ?? 100)
    }

    // watch for completed prints to accumulate session usage
    @Watch('$store.state.printer.print_stats.state')
    onPrintStateChange(val: string, oldVal: string) {
        if (val === 'complete' && oldVal === 'printing' && this.activeFilament) {
            const currentMm = this.$store.state.printer.print_stats?.filament_used ?? 0
            const printMm = currentMm - this.sessionStartFilamentMm

            // accumulate session total
            this.sessionEstimatedMm += Math.max(0, printMm)

            // deduct estimated grams from remaining weight immediately
            const usedG = filamentMmToGrams(printMm, this.activeFilament.type)
            if (usedG > 0) {
                this.$store.dispatch('gui/filaments/updateFilament', {
                    ...this.activeFilament,
                    remainingWeight: Math.max(0, this.activeFilament.remainingWeight - usedG),
                    measurements: this.activeFilament.measurements ?? [],
                })
            }

            // reset baseline for next print in same session
            this.sessionStartFilamentMm = currentMm
        }
    }

    @Watch('activeFilament')
    onActiveFilamentChange() {
        this.dismissLowWarning = false
    }

    sendGcode(commands: string[]) {
        Vue.$socket.emit('printer.gcode.script', { script: commands.join('\n') })
    }

    onFilamentLoaded(filament: GuiFilamentsStateEntry) {
        this.$store.dispatch('gui/filaments/setActiveFilament', filament.id)
        // record where filament_used is right now as our session baseline
        this.sessionStartFilamentMm = this.$store.state.printer.print_stats?.filament_used ?? 0
        this.sessionEstimatedMm = 0

        const temp = filament.loadTemp
        this.sendGcode([
            'G28',
            'G90',
            'G1 Z50 F3000',
            `M109 S${temp}`,
            'G4 S60',
            'M104 S0',
        ])

        this.gcodeMessage = `Loading ${filament.brand} ${filament.type} — heating to ${temp}°C`
        this.showGcodeSent = true
    }

    unloadFilament() {
        if (!this.activeFilament) return
        const temp = this.activeFilament.loadTemp

        // hold reference before clearing active
        this.unloadingFilament = { ...this.activeFilament }

        // send correct G-code — heat extruder (M109), not bed
        this.sendGcode([
            'G28',
            'G90',
            'G1 Z50 F3000',
            `M109 S${temp}`,
            'G4 S60',
            'M104 S0',
        ])

        this.gcodeMessage = `Unloading — heating extruder to ${temp}°C`
        this.showGcodeSent = true

        // clear active filament
        this.$store.dispatch('gui/filaments/setActiveFilament', null)

        // open weigh dialog
        this.showWeighDialog = true
    }

    clearActiveFilament() {
        this.$store.dispatch('gui/filaments/setActiveFilament', null)
        this.sessionEstimatedMm = 0
        this.sessionStartFilamentMm = 0
    }

    editFilament(filament: GuiFilamentsStateEntry) {
        this.selectedFilament = filament
        this.showAddDialog = true
    }

    openAddDialog() {
        this.selectedFilament = null
        this.prefilledPreset = null
        this.showAddDialog = true
    }

    confirmDelete(filament: GuiFilamentsStateEntry) {
        this.filamentToDelete = filament
        this.showDeleteDialog = true
    }

    deleteFilament() {
        if (this.filamentToDelete) {
            if (this.isActive(this.filamentToDelete)) {
                this.$store.dispatch('gui/filaments/setActiveFilament', null)
            }
            this.$store.dispatch('gui/filaments/deleteFilament', this.filamentToDelete.id)
        }
        this.showDeleteDialog = false
        this.filamentToDelete = null
    }

    saveAsPreset(filament: GuiFilamentsStateEntry) {
        const existing = this.$store.getters['gui/filaments/getAllPresets']
            .find((p: any) => p.brand === filament.brand && p.type === filament.type)
        if (existing) {
            this.$store.dispatch('gui/filaments/deletePreset', existing.id)
        }
        this.$store.dispatch('gui/filaments/addPreset', {
            brand: filament.brand,
            type: filament.type,
            color: filament.color,
            loadTemp: filament.loadTemp,
            filamentWeight: filament.remainingWeight,
            spoolWeight: filament.spoolWeight,
            correctionFactor: filament.correctionFactor,
            warningThreshold: filament.warningThreshold,
        })
        this.showPresetSaved = true
    }

    refillFilament(filament: GuiFilamentsStateEntry) {
        this.selectedFilament = null
        this.prefilledPreset = {
            brand: filament.brand,
            type: filament.type,
            color: filament.color,
            loadTemp: filament.loadTemp,
            filamentWeight: filament.totalWeight - filament.spoolWeight,
            spoolWeight: filament.spoolWeight,
            correctionFactor: filament.correctionFactor,
            warningThreshold: filament.warningThreshold,
        }
        this.showAddDialog = true
    }
}
</script>