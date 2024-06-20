<template>
    <div v-if="loaded">
        <LineChartPage :messages="messages" :externalData="externalData" v-if="isLineChart"></LineChartPage>
        <PieChartPage :messages="messages" :externalData="externalData" v-if="!isLineChart"></PieChartPage>
        <div class="absolute right-10 bottom-10">
            <v-btn density="compact" :icon="isLineChart ? 'mdi-chart-pie':'mdi-chart-timeline-variant-shimmer'"
                size="x-large" color="primary" @click="toggleChartType()"></v-btn>
        </div>
    </div>
    <h1 v-if="!loaded" class="text-[5em]">Loading...</h1>
</template>

<script setup>
import LineChartPage from './page/LineChartPage.vue'
import PieChartPage from './page/PieChartPage.vue'
import { ref, onMounted } from 'vue'
import { snowflakeToDate } from './utils'

let messages = [], externalData;

const loaded = ref(false)
const isLineChart = ref(true);
const toggleChartType = () => {isLineChart.value = !isLineChart.value}

onMounted(async () => {
    const data = await fetch('/assets/data.json')
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching data:', error);
        });

    for (let [channelId, channelData] of Object.entries(data)) {
        for (let message of channelData.messages) {
            message.time = snowflakeToDate(message.id)
            message.channelId = channelId
            messages.push(message)
        }
    }

    externalData = await fetch('/assets/external.json')
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    loaded.value = true;
})
</script>