<template>
    <v-dialog v-model="showDialog" max-width="600px" persistent>
        <v-card>
            <v-card-title>{{ isEditing ? 'Edit Filament' : 'Add Filament' }}</v-card-title>
            <v-card-text>
                <!-- Row 1: Brand, Material Type -->
                <v-row>
                    <v-col cols="12" sm="6">
                        <v-text-field
                            v-model="form.brand"
                            label="Brand"
                            outlined
                            dense
                            hide-details="auto" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-select
                            v-model="form.type"
                            :items="materialTypes"
                            label="Material Type"
                            outlined
                            dense
                            hide-details="auto"
                            @change="onMaterialChange" />
                    </v-col>
                    <v-col v-if="form.type === 'Custom'" cols="12" sm="6">
                        <v-text-field
                            v-model="form.customType"
                            label="Custom Material Name"
                            outlined
                            dense
                            hide-details="auto" />
                    </v-col>
                </v-row>

                <!-- Row 2: Colour, Load Temp -->
                <v-row class="mt-2">
                    <v-col cols="12" sm="6">
                        <p class="mb-1 text-caption">Colour</p>
                        <v-menu
                            v-model="colorMenu"
                            :close-on-content-click="false"
                            offset-y>
                            <template #activator="{ on }">
                                <v-btn
                                    depressed
                                    :color="form.color || '#cccccc'"
                                    class="color-picker-btn"
                                    v-on="on">
                                    <span :style="{ color: contrastColor }">
                                        {{ form.color || 'Pick a colour' }}
                                    </span>
                                </v-btn>
                            </template>
                            <v-color-picker
                                v-model="form.color"
                                mode="hexa"
                                hide-inputs
                                show-swatches />
                        </v-menu>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field
                            v-model.number="form.loadTemp"
                            label="Load/Unload Temp (°C)"
                            type="number"
                            :max="maxExtruderTemp"
                            :hint="`Max: ${maxExtruderTemp}°C`"
                            :rules="[tempRule]"
                            persistent-hint
                            outlined
                            dense />
                    </v-col>
                </v-row>

                <v-divider class="my-4" />
                <p class="text-subtitle-2 mb-2">Weight</p>

                <!-- Row 3: Weight fields -->
                <v-row>
                    <v-col cols="12" sm="4">
                        <v-text-field
                            v-model.number="form.filamentWeight"
                            label="Filament Weight (g)"
                            type="number"
                            outlined
                            dense
                            hide-details="auto"
                            @input="onWeightInput('filament')" />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field
                            v-model.number="form.spoolWeight"
                            label="Spool Weight (g)"
                            type="number"
                            outlined
                            dense
                            hide-details="auto"
                            @input="onWeightInput('spool')" />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field
                            v-model.number="form.totalWeight"
                            label="Total Weight (g)"
                            type="number"
                            outlined
                            dense
                            hide-details="auto"
                            @input="onWeightInput('total')" />
                    </v-col>
                </v-row>

                <!-- Spool weight warning -->
                <v-alert v-if="showSpoolWarning" type="warning" dense text dismissible class="mt-2">
                    Heads up — the spool weight looks like it might actually be the total weight. Most spools weigh between 180–230g.
                </v-alert>

                <!-- Row 4: Correction factor + warning threshold -->
                <v-row class="mt-2">
                    <v-col cols="12" sm="6">
                        <v-text-field
                            v-model.number="form.correctionFactor"
                            label="Correction Factor"
                            type="number"
                            step="0.01"
                            outlined
                            dense
                            hint="1.0 = no correction. 1.05 = printer uses 5% more than estimated."
                            persistent-hint />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field
                            v-model.number="form.warningThreshold"
                            label="Low filament warning (g)"
                            type="number"
                            outlined
                            dense
                            hint="Warn when remaining filament drops below this weight."
                            persistent-hint />
                    </v-col>
                </v-row>
            </v-card-text>
                <!-- Presets -->
                <v-row v-if="presets.length > 0">
                    <v-col cols="12">
                        <v-select
                            :items="presetItems"
                            label="Load from preset"
                            outlined
                            dense
                            clearable
                            hide-details="auto"
                            @change="applyPreset" />
                    </v-col>
                </v-row>
                <v-divider v-if="presets.length > 0" class="my-4" />
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="close">Cancel</v-btn>
                <v-btn color="primary" :disabled="!isValid" @click="save">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { GuiFilamentsState, GuiFilamentsStateEntry, GuiFilamentsStatePreset } from '@/store/gui/filaments/types'
// Default temperatures per material
const materialTemps: Record<string, number> = {
    'PLA': 210,
    'PLA+': 220,
    'PETG': 240,
    'PETG-CF': 250,
    'ABS': 250,
    'ASA': 250,
    'TPU': 230,
    'Nylon': 260,
    'PC': 270,
    'Custom': 250,
}

const materialDensities: Record<string, number> = {
    'PLA':     1.24,
    'PLA+':    1.24,
    'PETG':    1.27,
    'PETG-CF': 1.30,
    'ABS':     1.05,
    'ASA':     1.07,
    'TPU':     1.21,
    'Nylon':   1.08,
    'PC':      1.20,
    'Custom':  1.24,
}

interface FilamentForm {
    brand: string
    type: string
    customType: string
    color: string
    loadTemp: number
    filamentWeight: number | null
    spoolWeight: number | null
    totalWeight: number | null
    correctionFactor: number
    warningThreshold: number
}

@Component
export default class FilamentManagerDialog extends Mixins(BaseMixin) {
    @Prop({ default: false }) readonly value!: boolean
    @Prop({ default: null }) readonly editFilament!: GuiFilamentsStateEntry | null

    materialTypes = ['PLA', 'PLA+', 'PETG', 'PETG-CF', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'Custom']

    form: FilamentForm = this.defaultForm()

    defaultForm(): FilamentForm {
        return {
            brand: '',
            type: 'PETG',
            customType: '',
            color: '',
            loadTemp: 240,
            filamentWeight: null,
            spoolWeight: null,
            totalWeight: null,
            correctionFactor: 1.0,
            warningThreshold: 100,
        }
    }

    get showDialog() {
        return this.value
    }

    set showDialog(val: boolean) {
        this.$emit('input', val)
    }

    get isEditing() {
        return this.editFilament !== null
    }

    get showSpoolWarning() {
        const s = this.form.spoolWeight
        const f = this.form.filamentWeight
        if (s === null) return false
        // warn if spool weight >= filament weight (spool can't be heavier than the filament)
        if (f !== null && s >= f) return true
        // warn if spool weight looks like a full roll (over 500g)
        if (s >= 500) return true
        return false
    }

    get isValid() {
    const hasType = this.form.type !== 'Custom' || this.form.customType.trim() !== ''
    const hasWeight = this.form.filamentWeight !== null || this.form.totalWeight !== null
    const validTemp = this.form.loadTemp <= this.maxExtruderTemp
    return this.form.brand.trim() !== '' && hasType && hasWeight && validTemp
    }

    get resolvedType() {
        return this.form.type === 'Custom' ? this.form.customType : this.form.type
    }

    get maxExtruderTemp(): number {
    const activeExtruder = this.$store.state.printer.toolhead?.extruder
    const settings = this.$store.state.printer.configfile?.settings?.[activeExtruder]
    return settings?.max_temp ?? 300
    }

    get tempRule() {
    return (v: number) =>
        v <= this.maxExtruderTemp || `Max temp for your printer is ${this.maxExtruderTemp}°C`
    }

    colorMenu = false

    get contrastColor() {
        // returns black or white text depending on background colour
        if (!this.form.color) return '#000000'
        const hex = this.form.color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        return luminance > 0.5 ? '#000000' : '#ffffff'
    }

    get presets(): GuiFilamentsStatePreset[] {
        return this.$store.getters['gui/filaments/getAllPresets']
    }

    get presetItems() {
        return this.presets.map((p) => ({
            text: `${p.brand} ${p.type}`,
            value: p.id,
        }))
    }

    applyPreset(id: string) {
        if (!id) return
        const preset = this.presets.find((p) => p.id === id)
        if (!preset) return
        this.form.brand = preset.brand
        this.form.type = this.materialTypes.includes(preset.type) ? preset.type : 'Custom'
        this.form.customType = this.materialTypes.includes(preset.type) ? '' : preset.type
        this.form.color = preset.color
        this.form.loadTemp = preset.loadTemp
        this.form.spoolWeight = preset.spoolWeight
        this.form.correctionFactor = preset.correctionFactor
        this.form.warningThreshold = preset.warningThreshold ?? 100
    }

    onMaterialChange(type: string) {
        this.form.loadTemp = materialTemps[type] ?? 250
    }

    onWeightInput(changed: 'filament' | 'spool' | 'total') {
        const { filamentWeight: f, spoolWeight: s, totalWeight: t } = this.form
        if (changed === 'filament' && f !== null && s !== null) {
            this.form.totalWeight = f + s
        } else if (changed === 'spool' && f !== null && s !== null) {
            this.form.totalWeight = f + s
        } else if (changed === 'total' && t !== null && s !== null) {
            this.form.filamentWeight = t - s
        } else if (changed === 'total' && t !== null && f !== null) {
            this.form.spoolWeight = t - f
        }
        // auto-set smart default threshold
        this.form.warningThreshold = (this.form.spoolWeight ?? 0) > 0 ? 100 : 200
    }

    @Watch('value')
    onValueChange(val: boolean) {
        if (val && this.editFilament) {
            // populate form when editing
            this.form = {
                brand: this.editFilament.brand,
                type: this.materialTypes.includes(this.editFilament.type)
                    ? this.editFilament.type
                    : 'Custom',
                customType: this.materialTypes.includes(this.editFilament.type)
                    ? ''
                    : this.editFilament.type,
                color: this.editFilament.color,
                loadTemp: this.editFilament.loadTemp,
                filamentWeight: this.editFilament.totalWeight - (this.editFilament.spoolWeight ?? 0),
                spoolWeight: this.editFilament.spoolWeight ?? null,
                totalWeight: this.editFilament.totalWeight,
                correctionFactor: this.editFilament.correctionFactor,
                warningThreshold: this.editFilament.warningThreshold ?? 100,
            }
        } else if (val) {
            this.form = this.defaultForm()
        }
    }

    save() {
        const filamentWeight = this.form.filamentWeight ?? (this.form.totalWeight! - (this.form.spoolWeight ?? 0))
        const totalWeight = this.form.totalWeight ?? (filamentWeight + (this.form.spoolWeight ?? 0))

        const entry = {
            brand: this.form.brand.trim(),
            type: this.resolvedType,
            color: this.form.color.trim(),
            loadTemp: this.form.loadTemp,
            totalWeight,
            spoolWeight: this.form.spoolWeight ?? 0,
            remainingWeight: filamentWeight,
            correctionFactor: this.form.correctionFactor,
            warningThreshold: this.form.warningThreshold,
        }

        if (this.isEditing && this.editFilament) {
            this.$store.dispatch('gui/filaments/updateFilament', {
                ...entry,
                id: this.editFilament.id,
                rollId: this.editFilament.rollId,
                loadedAt: this.editFilament.loadedAt ?? null,
                measurements: this.editFilament.measurements ?? [],
            })
        } else {
            this.$store.dispatch('gui/filaments/addFilament', entry)
        }

        this.close()
    }

    close() {
        this.showDialog = false
        this.form = this.defaultForm()
    }
}
</script>