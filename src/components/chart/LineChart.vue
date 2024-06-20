<template>
    <div class="h-auto lg:w-[100vh] md:w-[90vw] w-[100vw] flex flex-col">
        <canvas class="w-full h-full m-auto" ref="myChart"></canvas>
        <v-range-slider step="0.2" v-model="sliderValue" class="px-[1em]" color="blue-grey-lighten-4"></v-range-slider>
        <v-switch v-model="enableAnimation" :label="`Animation${enableAnimation ? '✨':''}`" class="ml-4"
            :color="enableAnimation?'orange':''" hide-details inset></v-switch>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount,watch, computed } from 'vue'
import { Chart as ChartJS } from 'chart.js/auto';
import { zhTW } from 'date-fns/locale';
import 'chartjs-adapter-date-fns';


let chart;
let timeRange;
const sliderValue = ref([0, 100])
const myChart = ref(null);

const enableAnimation = ref(false)

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
    if (Math.abs(sliderValue.value[0] - sliderValue.value[1]) > 0.2)
    updateChartRange();
})

watch(enableAnimation, (value) => {
    toggleAnimation(value);
})

const options = {
    animation:false,
    parsing:false,
    normalized: true,
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    },
    plugins: {
        decimation: {
            enabled: true,
            threshold: 100,
            samples: 100,
            algorithm: 'lttb',
        },
        legend: {
            display:false
        },
    },
    scales: {
        x: {
            type: 'time',
            time: {
                unit: 'day'
            },
            ticks: {
                source: 'auto',
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

// function _addDataset(dataset) {
//     if(datasets.data)
// }

function setDatasets(dataset) {
    chart.data.datasets = dataset
    chart.update()
    updateDatasetsTimeRange();
    updateChartRange();
}

function updateChartRange() {
    const [from,to] = timeRange;
    const unit = (to - from) / 100
    chart.options.scales.x.min = from + (unit * sliderValue.value[0]);
    chart.options.scales.x.max = from + (unit * sliderValue.value[1]);
    chart.update();
}

function toggleAnimation(value) {
    chart.options.animation = value;
}

defineExpose({ setDatasets })

</script>