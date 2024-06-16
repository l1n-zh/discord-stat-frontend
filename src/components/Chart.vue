<template>
    <div class="w-[60%]">
        <canvas ref="myChart"></canvas>
    </div>
    <button @click="test()">test</button>
</template>

<script setup>
import { ref, onMounted, onBeforeMount } from 'vue'
import { Chart } from 'chart.js/auto';

defineProps({
    msg: String,
})

const myChart = ref(null);
const data = ref([]);
let chart;

onBeforeMount(() => {
    data.value = [
        { year: 2010, count: 10 },
        { year: 2011, count: 20 },
        { year: 2012, count: 15 },
        { year: 2013, count: 25 },
        { year: 2014, count: 22 },
        { year: 2015, count: 30 },
        { year: 2016, count: 28 },
    ];
})

const test = () => {
    data.value[0].count += 10;
    chart.data = getChartData();
    chart.update();
}

onMounted(() => {
    const ctx = myChart.value.getContext('2d');
    chart = new Chart(
        ctx, {
        type: 'bar'
    }
    );
    chart.data = getChartData();
    chart.update();
});

function getChartData() {
    return {
        labels: data.value.map(row => row.year),
        datasets: [
            {
                label: 'Acquisitions by year',
                data: data.value.map(row => row.count)
            }
        ]
    }
}

function fetchDate() {
    fetch('/src/assets/data.json')
        .then(response => response.json())
        .then(data => {
            return data
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}
</script>


<style scoped>
.read-the-docs {
    color: #888;
}
</style>
