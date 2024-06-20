<template>
    <div class="h-auto lg:w-[100vh] md:w-[90vw] w-[100vw] flex flex-col">
        <canvas class="w-full h-full m-auto" ref="myChart"></canvas>
        <v-range-slider step="0.1" v-model="sliderValue" class="px-[1em]" color="blue-grey-lighten-4"></v-range-slider>
        <div class="grid grid-cols-2">
            <v-switch v-model="enableAnimation" :label="`Animation${enableAnimation ? '✨' : ''}`" class="ml-4"
                :color="enableAnimation ? 'orange' : ''" hide-details inset></v-switch>
            <v-number-input class="" label="max labels count" v-model="maxLabelsCount" :min="1"
                variant="outlined"></v-number-input>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount,watch, computed } from 'vue'
import { Chart as ChartJS, Interaction } from 'chart.js/auto';
import { zhTW } from 'date-fns/locale';
import 'chartjs-adapter-date-fns';
// import { Interaction } from 'chart.js';
import { getRelativePosition } from 'chart.js/helpers';


let chart;
let timeRange;
const sliderValue = ref([0, 100])
const myChart = ref(null);
const maxLabelsCount = ref(10)

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

watch(maxLabelsCount, () => {
    chart.update()
})

watch(enableAnimation, (value) => {
    toggleAnimation(value);
})

Interaction.modes.myCustomMode = function (chart, e, options, useFinalPosition) {
    const position = getRelativePosition(e, chart);
    const items = [];
    Interaction.evaluateInteractionItems(chart, 'x', position, (element, datasetIndex, index) => {
        if (element.x <= position.x && datasetIndex < maxLabelsCount.value) {
            items[datasetIndex] = { element, datasetIndex, index };
        }
    });
    items.sort((a, b) => a.element.y - b.element.y )
    return items.filter(e => e !== null && e.element.y !== 0)
};

const options = {
    animation:false,
    parsing:false,
    normalized: true,
    interaction: {
        mode: 'myCustomMode',
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
            position:'chartArea',
            labels: {
                filter: function (label) {
                    return label.datasetIndex < maxLabelsCount.value;
                }
            }
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