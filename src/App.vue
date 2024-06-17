<template>
    <div class="flex flex-col items-center">
        <div class="lg:w-[80%] flex w-full">
            <LineChart v-if="loaded" :data="data" label="test" ref="lineChart" class="w-full h-full"></LineChart>
        </div>

        <div class="lg:w-[60%] w-[90%]">
            <Filter label="channel"
                :items="[{ 'title': 'general', 'subtitle': '', 'value': '1250711874111148066' }, { 'title': '測試', 'subtitle': '', 'value': '1251578118851006484' }, { 'title': '測試2', 'subtitle': '', 'value': '1251578167869837344' }]"
                :filter="ChannelIdFilter" :callback="filterInstance => channelIdFilterInstance = filterInstance">
            </Filter>

            <Filter label="user"
                :items="[{ 'title': '__lin__', 'subtitle': 'lzch.', 'value': '886902195776258099' }, { 'title': 'yun._.shiuan', 'subtitle': 'yun._.shiuan', 'value': '634926663997718567' }]"
                :filter="AuthorFilter" :callback="filterInstance => authorFilterInstance = filterInstance"></Filter>

            <Filter label="time of day" :items="generate24HourArray()" :filter="TimeOfDayFilter"
                :callback="filterInstance => timeOfDayFilterInstance = filterInstance"></Filter>

            <v-btn @click="submit()" variant="tonal" append-icon="mdi-chart-timeline-variant-shimmer"
                size="x-large">submit</v-btn>
        </div>
    </div>
</template>

<script setup>
import LineChart from './components/chart/LineChart.vue'
import Filter from './components/Filter.vue';
import { ref, onMounted } from 'vue'
import { query, ChannelIdFilter, AuthorFilter, TimeOfDayFilter } from './components/filter'
import { generate24HourArray } from './utils.js'


let channelIdFilterInstance, authorFilterInstance, timeOfDayFilterInstance; // TODO

const loaded = ref(false)
let rawData = []
let data = [];

const lineChart = ref(null)

function submit() {
    lineChart.value.setDatasets([{
        label: 'test data',
        data: getData()
    }])
}

onMounted(async () => {
    rawData = await fetch('/src/assets/data.json')
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    loaded.value = true;
})

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