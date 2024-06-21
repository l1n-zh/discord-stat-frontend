<template>
    <div id="chartdiv" class="w-full h-[70vh]"></div>
</template>

<script setup>
import { onMounted } from 'vue';
import { Chart } from './chart-race';
import { format, toDate } from 'date-fns';
let chart;

let { data, timeLabels } = defineProps(['data', 'timeLabels']);
const options = {
    stepDuration: 2000,
    timeDuration: 1000 * 60 * 60 * 24 * 30.4375,
    maxRow: 10,
    timeFormatter: (timestamp) => format(timestamp, 'yyyy MMM')
}

const options2 = {
    stepDuration: 1000,
    timeDuration: 1000 * 60 * 60 * 24,
    maxRow: 10,
    timeFormatter: (timestamp) => format(timestamp, 'yyyy/MM/dd')
}

function setDatasets(datasets) {
    chart.update(datasets, options2)
}

onMounted(() => {
    chart = new Chart('chartdiv');
})


defineExpose({ setDatasets })
</script>
