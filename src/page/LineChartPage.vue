<template>
    <div class="flex flex-col items-center">
        <div class="">
            <LineChart ref="chart"></LineChart>
        </div>

        <div class="lg:w-[60%] w-[90%]">
            <Filter label="channel"
                :items="externalData.channels"
                :filter="ChannelIdFilter" :callback="filterInstance => channelIdFilterInstance = filterInstance">
            </Filter>

            <Filter label="user"
                :items="externalData.users"
                :filter="AuthorFilter" :callback="filterInstance => authorFilterInstance = filterInstance"></Filter>

            <Filter label="time of day" :items="generate24HourArray()" :filter="TimeOfDayFilter"
                :callback="filterInstance => timeOfDayFilterInstance = filterInstance"></Filter>

            <v-btn @click="submit()" variant="tonal" append-icon="mdi-chart-timeline-variant-shimmer"
                size="x-large">submit</v-btn>
        </div>
    </div>
</template>

<script setup>
import LineChart from '@/components/chart/LineChart.vue'
import Filter from '@/components/Filter.vue';
import { ref, onMounted } from 'vue'
import { query, ChannelIdFilter, AuthorFilter, TimeOfDayFilter } from '@/components/filter'
import { generate24HourArray } from '../utils.js'


let channelIdFilterInstance, authorFilterInstance, timeOfDayFilterInstance; // TODO

const { rawData, externalData } = defineProps(['rawData', 'externalData'])

const chart = ref(null)

function submit() {
    chart.value.setDatasets([{
        label: 'message count',
        data: getData()
    }])
}


function getData() {
    let data = [];
    let messageCount = 0;
    for (let message of query(rawData, [channelIdFilterInstance], [authorFilterInstance, timeOfDayFilterInstance]).sort((a, b) => a.time - b.time)) {
        ++messageCount;
        data.push({
            y: messageCount,
            x: message.time,
        })
    }
    return data;
}

</script>