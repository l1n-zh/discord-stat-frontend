<template>
    <div class="max-h-[60vh] max-w-[100vw] flex flex-col">
        <canvas class="w-full h-full m-auto" ref="myChart"></canvas>
        <v-range-slider v-model="value" thumb-label="always" class="w-full"></v-range-slider>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount } from 'vue'
import { Chart as ChartJS } from 'chart.js/auto';
import { zhTW } from 'date-fns/locale';
import 'chartjs-adapter-date-fns';


const value = ref([20, 40])
const myChart = ref(null);
let chart;

const props = defineProps(['data', 'label'])

onMounted(() => {
    const ctx = myChart.value.getContext('2d');
    chart = new ChartJS(
        ctx, {
        type: 'line'
    });

    chart.data = { datasets: [] };
    chart.options = options;
    chart.update();
});


const options = {
    scales: {
        x: {
            type: 'time',
            time: {
                unit: 'day'
            },
            ticks: {
                source: 'auto',
                // Disabled rotation for performance
                maxRotation: 0,
                autoSkip: true,
            },
        }
    },
    adapters: {
        date: {
            locale: zhTW
        }
    },
    elements: {
        point: {
            radius: 0
        }
    },
    spanGaps: true
}

function setDatasets(dataset) {
    chart.data.datasets = dataset
    chart.update()
}

function addDataset(dataset) {
    chart.data.datasets.push(dataset)
    chart.update()
}

function removeDataset(label) {
    setDatasets(chart.data.datasets.filter( dataset => dataset.label !== label))
}

function setRange(min, max) {
    chart.scales.x.min = min;
    chart.scales.x.max = max;
    chart.update();
}

defineExpose({ addDataset,removeDataset, setDatasets ,setRange })

</script>