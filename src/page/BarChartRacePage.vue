<template>
    <div class="flex flex-col items-center">
            <BarChartRace ref="chart"></BarChartRace>

        <div class="lg:w-[60%] w-[95%]">
            <Filter label="channel" :items="externalData.channels" :filter="ChannelIdFilter" :callback="addFilter"
                class="m-2">
            </Filter>
            <Filter label="user" :items="externalData.users" :filter="AuthorFilter" :callback="addFilter" class="m-2">
            </Filter>
            <Filter label="time of day" :items="generate24HourArray()" :filter="TimeOfDayFilter" class="m-2"
                :callback="addFilter"></Filter>
            <div class="md:flex">
                <v-btn-toggle v-model="baseOn" variant="outlined" divided class="block w-full">
                    <v-btn :value="0">
                        <v-icon start>
                            mdi-forum
                        </v-icon>
                        <span class="hidden-sm-and-down">Channel</span>
                    </v-btn>

                    <v-btn :value="1">
                        <v-icon start>
                            mdi-account
                        </v-icon>
                        <span class="hidden-sm-and-down">User</span>
                    </v-btn>

                    <v-btn :value="2">
                        <v-icon start>
                            mdi-clock
                        </v-icon>
                        <span class="hidden-sm-and-down">Time Of Day</span>
                    </v-btn>

                    <v-btn :value="3">
                        <v-icon start>
                            mdi-sigma
                        </v-icon>
                        <span class="hidden-sm-and-down">Sum</span>
                    </v-btn>
                </v-btn-toggle>
                <v-btn @click="submit()" color="secondary" append-icon="mdi-chart-timeline-variant-shimmer"
                    class="ml-auto" size="x-large">submit</v-btn>
            </div>

        </div>
    </div>
</template>

<script setup>
import BarChartRace from '@/components/chart/BarChartRace.vue'
import Filter from '@/components/Filter.vue';
import { ref, onMounted } from 'vue'
import { query, ChannelIdFilter, AuthorFilter, TimeOfDayFilter } from '@/components/filter'
import { generate24HourArray } from '../utils.js'

const { messages, externalData } = defineProps(['messages', 'externalData'])
const chart = ref(null)
const baseOn = ref(0)

let filters = {}
const addFilter = filter => filters[filter.name] = filter;

onMounted(() => {
    submit()
})


function getDatasets(labelMapping, extractDataKey) {
    let dataMapping = {}
    let messageCounts = {}

    for (let message of query(messages, Object.values(filters)).sort((a, b) => a.time - b.time)) {
        const dataKey = extractDataKey(message)
        if (dataKey in dataMapping) {
            dataMapping[dataKey].push({
                y: ++messageCounts[dataKey],
                x: message.time,
            })
        } else {
            dataMapping[dataKey] = [{
                y: 1,
                x: message.time,
            }]
            messageCounts[dataKey] = 1;
        }
    }

    const dataSets = []
    for (let [dataKey, data] of Object.entries(dataMapping).sort(([key1,], [key2,]) => messageCounts[key2] - messageCounts[key1])) {
        if (messageCounts[dataKey] == 0)
            break
        dataSets.push(
            {
                label: labelMapping[dataKey],
                data: data,
            }
        )
    }
    return dataSets;
}

function getTimeOfDayDatasets() {
    let labelMapping = {};
    for (let data of generate24HourArray()) {
        labelMapping[data.value] = (data.title + ' ( ' + data.subtitle + ' )')
    }
    return getDatasets(labelMapping, message => new Date(message.time).getHours());
}

function getAuthorDatasets() {
    let labelMapping = {};
    for (let data of externalData.users) {
        labelMapping[data.value] = (data.title + ' ( ' + data.subtitle + ' )')
    }
    return getDatasets(labelMapping, message => message.authorId);
}

function getChannelDatasets() {
    let labelMapping = {};
    for (let data of externalData.channels) {
        labelMapping[data.value] = data.title
    }
    return getDatasets(labelMapping, message => message.channelId);
}

function getSumDatasets() {
    let data = [];
    let messageCount = 0;
    for (let message of query(messages, Object.values(filters)).sort((a, b) => a.time - b.time)) {
        ++messageCount;
        data.push({
            y: messageCount,
            x: message.time,
        })
    }
    return ([{
        label: 'messages count',
        data: data
    }])
}

function submit() {
    const getDatasets = [getChannelDatasets, getAuthorDatasets, getTimeOfDayDatasets, getSumDatasets][baseOn.value]
    chart.value.setDatasets(getDatasets());
}



</script>