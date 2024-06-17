<template>
    <div class="h-auto lg:w-[100vh] md:w-[90vw] w-[100vw] flex flex-col">
        <canvas class="w-full h-full m-auto" ref="myChart" ></canvas>
        <v-range-slider step="1" v-model="sliderValue" class="px-[1em]"></v-range-slider>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount,watch } from 'vue'
import { Chart as ChartJS } from 'chart.js/auto';
import { zhTW } from 'date-fns/locale';
import 'chartjs-adapter-date-fns';


const sliderValue = ref([0, 100])
const myChart = ref(null);
let chart;

let timeRange;

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

watch(sliderValue, () => {
    updateChartRange();
})

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
            }
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


function updateDatasetsTimeRange() {
    let minTime = Infinity;
    let maxTime = -Infinity;

    for (const dataset of chart.data.datasets) {
        const firstX = dataset.data[0].x;
        const lastX = dataset.data[dataset.data.length - 1].x;

        minTime = Math.min(minTime, firstX);
        maxTime = Math.max(maxTime, lastX);
    }

    timeRange = [minTime, maxTime];
}

function setDatasets(dataset) {
    chart.data.datasets = dataset
    chart.update()
    updateDatasetsTimeRange();
    updateChartRange();
}

function addDataset(dataset) {
    chart.data.datasets.push(dataset)
    updateDatasetsTimeRange();
    updateChartRange();
}

function removeDataset(label) {
    setDatasets(chart.data.datasets.filter( dataset => dataset.label !== label))
}

function updateChartRange() {
    const [from,to] = timeRange;
    const unit = (to - from) / 100
    chart.options.scales.x.min = from + (unit * sliderValue.value[0]);
    chart.options.scales.x.max = from + (unit * sliderValue.value[1]);
    chart.update();
}

defineExpose({ addDataset,removeDataset, setDatasets })

</script>