<template>
    <div v-if="loaded">
        <LineChartPage :rawData="data" :externalData="externalData" v-if="isLineChart"></LineChartPage>
        <PieChartPage :rawData="data" :externalData="externalData" v-if="!isLineChart"></PieChartPage>
        <div class="absolute right-10 bottom-10">
            <v-btn density="compact" :icon="isLineChart ? 'mdi-chart-pie':'mdi-chart-timeline-variant-shimmer'" size="x-large" color="primary" @click="()=>{isLineChart = !isLineChart}"></v-btn>
        </div>
    </div>
    <div v-if="!loaded" class="text-lg">Loading...</div>
</template>

<script setup>
import LineChartPage from './page/LineChartPage.vue'
import PieChartPage from './page/PieChartPage.vue'
import { ref, onMounted } from 'vue'
import { convertTimeZone, snowflakeToDate } from './utils'

const loaded = ref(false)

let data = [], externalData;
const isLineChart = ref(true);

onMounted(async () => {
    data = await fetch('/big_assets/data.json')
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching data:', error);
        });

    for (let [channelId, channelData] of Object.entries(data)) {
        for (let message of channelData.messages) {
            message.time = convertTimeZone(snowflakeToDate(message.id), "Asia/Taipei")
            message.channelId = channelId
        }
    }

    externalData = await fetch('/big_assets/external.json')
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    loaded.value = true;
})
</script>