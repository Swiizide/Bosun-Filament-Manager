<template>
    <v-dialog v-model="showDialog" max-width="500px" persistent>
        <v-card>
            <v-card-title>
                <v-icon left color="primary">{{ mdiScale }}</v-icon>
                Weigh Spool
            </v-card-title>
            <v-card-text>
                <p class="text--secondary mb-4">
                    Weigh your spool and enter the current total weight below.
                    This helps improve the correction factor over time.
                </p>

                <!-- Print summary -->
                <v-row v-if="estimatedUsedG > 0" class="mb-2">
                    <v-col cols="6" class="text-center">
                        <span class="text-caption text--secondary">Estimated used</span>
                        <br />
                        <span class="font-weight-bold">{{ estimatedUsedG.toFixed(1) }}g</span>
                    </v-col>
                    <v-col cols="6" class="text-center">
                        <span class="text-caption text--secondary">Before this print</span>
                        <br />
                        <span class="font-weight-bold">{{ filament ? filament.remainingWeight : '--' }}g</span>
                    </v-col>
                </v-row>

                <v-divider class="mb-4" />

                <!-- Weight input -->
                <v-row>
                    <v-col cols="12">
                        <v-text-field
                            v-model.number="newTotalWeight"
                            label="Current spool weight (g)"
                            type="number"
                            outlined
                            dense
                            hint="Weigh the whole spool including the empty spool weight"
                            persistent-hint
                            autofocus />
                    </v-col>
                </v-row>

                <!-- Calculated result -->
                <v-row v-if="newRemainingWeight !== null" class="mt-2">
                    <v-col cols="6" class="text-center">
                        <span class="text-caption text--secondary">New remaining</span>
                        <br />
                        <span class="font-weight-bold">{{ newRemainingWeight.toFixed(1) }}g</span>
                    </v-col>
                    <v-col cols="6" class="text-center">
                        <span class="text-caption text--secondary">Actually used</span>
                        <br />
                        <span class="font-weight-bold">{{ actualUsedG.toFixed(1) }}g</span>
                    </v-col>
                </v-row>

                <!-- New correction factor preview -->
                <v-row v-if="newCorrectionFactor !== null && estimatedUsedG > 0" class="mt-2">
                    <v-col class="text-center">
                        <span class="text-caption text--secondary">Updated correction factor</span>
                        <br />
                        <span class="font-weight-bold">
                            {{ filament ? filament.correctionFactor.toFixed(3) : '--' }}
                            <v-icon small>{{ mdiArrowRight }}</v-icon>
                            {{ newCorrectionFactor.toFixed(3) }}
                        </span>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn text @click="close">Skip</v-btn>
                <v-btn
                    color="primary"
                    :disabled="newTotalWeight === null || newTotalWeight <= 0"
                    @click="save">
                    Save
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiScale, mdiArrowRight } from '@mdi/js'
import { GuiFilamentsStateEntry } from '@/store/gui/filaments/types'
import { filamentMmToGrams, calculateCorrectionFactor } from '@/store/gui/filaments/helpers'

@Component
export default class FilamentWeighDialog extends Mixins(BaseMixin) {
    @Prop({ default: false }) readonly value!: boolean
    @Prop({ default: null }) readonly filament!: GuiFilamentsStateEntry | null
    @Prop({ default: 0 }) readonly filamentUsedMm!: number

    mdiScale = mdiScale
    mdiArrowRight = mdiArrowRight

    newTotalWeight: number | null = null

    get showDialog() {
        return this.value
    }

    set showDialog(val: boolean) {
        this.$emit('input', val)
    }

    // convert mm used to grams using material density
    get estimatedUsedG(): number {
        if (!this.filament || !this.filamentUsedMm) return 0
        return filamentMmToGrams(this.filamentUsedMm, this.filament.type)
    }

    // remaining filament = new total weight - spool weight
    get newRemainingWeight(): number | null {
        if (this.newTotalWeight === null || !this.filament) return null
        return Math.max(0, this.newTotalWeight - this.filament.spoolWeight)
    }

    // how much was actually used
    get actualUsedG(): number {
        if (this.newRemainingWeight === null || !this.filament) return 0
        return Math.max(0, this.filament.remainingWeight - this.newRemainingWeight)
    }

    // preview the new correction factor
    get newCorrectionFactor(): number | null {
        if (!this.filament || this.estimatedUsedG <= 0 || this.actualUsedG <= 0) return null
        const measurementCount = (this.filament.measurements?.length ?? 0) + 1
        return calculateCorrectionFactor(
            this.filament.correctionFactor,
            this.actualUsedG,
            this.estimatedUsedG,
            measurementCount
        )
    }

    @Watch('value')
    onValueChange(val: boolean) {
        if (val) this.newTotalWeight = null
    }

    save() {
        if (!this.filament || this.newRemainingWeight === null) return

        const today = new Date().toISOString().split('T')[0]
        const existingMeasurements = Array.isArray(this.filament.measurements)
            ? this.filament.measurements
            : []

        const measurement = {
            date: today,
            remainingWeight: this.newRemainingWeight,
            actualUsedG: this.actualUsedG,
            estimatedUsedG: this.estimatedUsedG,
            correctionFactor: this.newCorrectionFactor ?? this.filament.correctionFactor,
        }

        const measurements = [...existingMeasurements, measurement]

        // only update correction factor after 3+ measurements
        const correctionFactor = measurements.length >= 3 && this.newCorrectionFactor !== null
            ? this.newCorrectionFactor
            : this.filament.correctionFactor

        // update filament
        this.$store.dispatch('gui/filaments/updateFilament', {
            ...this.filament,
            remainingWeight: this.newRemainingWeight,
            correctionFactor,
            measurements,
        })

        // update matching preset if one exists
        const presets = this.$store.getters['gui/filaments/getAllPresets']
        const matchingPreset = presets.find(
            (p: any) => p.brand === this.filament!.brand && p.type === this.filament!.type
        )
        if (matchingPreset && measurements.length >= 3) {
            this.$store.dispatch('gui/filaments/updatePreset', {
                ...matchingPreset,
                correctionFactor,
            })
        }

        this.$store.dispatch('gui/filaments/logMeasurement', {
            filamentId: this.filament.id,
            filamentName: `${this.filament.brand} ${this.filament.type}`,
            rollId: this.filament.rollId,
            loadedAt: this.filament.loadedAt,
            apiUrl: this.apiUrl,
            measurement,
        })

        this.close()
    }

    close() {
        this.showDialog = false
    }
}
</script>