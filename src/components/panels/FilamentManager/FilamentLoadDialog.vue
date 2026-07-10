<template>
    <v-dialog v-model="showDialog" max-width="700px">
        <v-card>
            <v-card-title class="d-flex align-center">
                <span>Select Filament to Load</span>
                <v-spacer />
                <!-- View toggle -->
                <v-btn icon small @click="viewMode = 'list'" :color="viewMode === 'list' ? 'primary' : ''">
                    <v-icon small>{{ mdiViewList }}</v-icon>
                </v-btn>
                <v-btn icon small @click="viewMode = 'card'" :color="viewMode === 'card' ? 'primary' : ''">
                    <v-icon small>{{ mdiViewGrid }}</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text>
                <!-- List view -->
                <template v-if="viewMode === 'list'">
                    <v-row
                        v-for="filament in filaments"
                        :key="filament.id"
                        align="center"
                        class="filament-list-row"
                        style="cursor: pointer"
                        @click="selectFilament(filament)">
                        <v-col cols="auto">
                            <v-icon :color="filament.color" small>{{ mdiCircle }}</v-icon>
                        </v-col>
                        <v-col>
                            <span class="font-weight-medium">{{ filament.brand }} {{ filament.type }}</span>
                            <span class="text-caption text--secondary ml-2">{{ filament.color }}</span>
                        </v-col>
                        <v-col cols="auto">
                            <span class="text-caption text--secondary">
                                {{ filament.remainingWeight }}g / {{ filament.totalWeight }}g
                            </span>
                        </v-col>
                        <v-col cols="auto">
                            <v-icon small color="primary">{{ mdiChevronRight }}</v-icon>
                        </v-col>
                    </v-row>
                </template>

                <!-- Card view -->
                <template v-else>
                    <v-row>
                        <v-col
                            v-for="filament in filaments"
                            :key="filament.id"
                            cols="12"
                            sm="6">
                            <v-card
                                outlined
                                style="cursor: pointer"
                                @click="selectFilament(filament)">
                                <v-card-text>
                                    <div class="d-flex align-center mb-2">
                                        <v-icon :color="filament.color" class="mr-2">{{ mdiCircle }}</v-icon>
                                        <span class="font-weight-bold">{{ filament.brand }}</span>
                                    </div>
                                    <div class="text-subtitle-2">{{ filament.type }}</div>
                                    <div class="text-caption text--secondary">{{ filament.color }}</div>
                                    <v-progress-linear
                                        :value="remainingPercent(filament)"
                                        :color="filament.color"
                                        background-color="grey lighten-3"
                                        rounded
                                        height="6"
                                        class="mt-2" />
                                    <div class="text-caption text--secondary mt-1">
                                        {{ filament.remainingWeight }}g of {{ filament.totalWeight }}g remaining
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </template>

                <!-- Empty state -->
                <v-row v-if="filaments.length === 0">
                    <v-col class="text-center text--disabled">
                        No filaments added yet.
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-btn small color="primary" outlined @click="addNewFilament">
                    <v-icon small left>{{ mdiPlus }}</v-icon>
                    Add New Filament
                </v-btn>
                <v-spacer />
                <v-btn text @click="close">Cancel</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiCircle, mdiViewList, mdiViewGrid, mdiChevronRight, mdiPlus } from '@mdi/js'
import { GuiFilamentsStateEntry } from '@/store/gui/filaments/types'

@Component
export default class FilamentLoadDialog extends Mixins(BaseMixin) {
    @Prop({ default: false }) readonly value!: boolean

    mdiCircle = mdiCircle
    mdiViewList = mdiViewList
    mdiViewGrid = mdiViewGrid
    mdiChevronRight = mdiChevronRight
    mdiPlus = mdiPlus

    viewMode: 'list' | 'card' = 'list'

    get showDialog() {
        return this.value
    }

    set showDialog(val: boolean) {
        this.$emit('input', val)
    }

    get filaments(): GuiFilamentsStateEntry[] {
        return this.$store.getters['gui/filaments/getAllFilaments']
    }

    remainingPercent(filament: GuiFilamentsStateEntry): number {
        if (!filament.totalWeight) return 0
        const net = filament.totalWeight - filament.spoolWeight
        if (net <= 0) return 0
        return Math.round((filament.remainingWeight / net) * 100)
    }

    selectFilament(filament: GuiFilamentsStateEntry) {
        this.$emit('load', filament)
        this.close()
    }

    addNewFilament() {
        this.$emit('add-new')
        this.close()
    }

    close() {
        this.showDialog = false
    }
}
</script>