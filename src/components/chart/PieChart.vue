<template>
    <div class="h-auto max-w-[90vh] w-full flex flex-col">
        <canvas class="w-full h-full m-auto" ref="myChart"></canvas>
        <v-switch v-model="enableAnimation" :label="`Animation${enableAnimation ? '✨' : ''}`" class="ml-4"
            :color="enableAnimation ? 'orange' : ''" hide-details inset></v-switch>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount, watch, computed } from 'vue'
import { Chart as ChartJS } from 'chart.js/auto';
import { zhTW } from 'date-fns/locale';
import 'chartjs-adapter-date-fns';


let chart;
const myChart = ref(null);

const enableAnimation = ref(false)

onMounted(() => {
    const ctx = myChart.value.getContext('2d');
    chart = new ChartJS(
        ctx, {
        type: 'pie'
    });

    chart.data = { labels: [], datasets: [{ data: [] }] };
    chart.options = options;
    chart.update();
});


watch(enableAnimation, (value) => {
    toggleAnimation(value);
})

const options = {
    animation: false,
}


// function _addDataset(dataset) {
//     if(datasets.data)
// }

function setData(data) {
    chart.data = data
    chart.update()
}

function addData(dataset) {
    // TODO
}

function removeData(label) {
    // TODO
}

function toggleAnimation(value) {
    chart.options.animation = value;
}

defineExpose({ addData, removeData, setData })

</script>