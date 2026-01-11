<template>
    <div v-if="loaded">
        <LineChartPage
            :messages="messages"
            :externalData="externalData"
            v-if="chartType === 0"
        ></LineChartPage>
        <PieChartPage
            :messages="messages"
            :externalData="externalData"
            v-if="chartType === 1"
        ></PieChartPage>
        <BarChartRace
            :messages="messages"
            :externalData="externalData"
            v-show="chartType === 2"
        ></BarChartRace>
        <div class="fixed right-4 bottom-4">
            <v-btn
                density="compact"
                :icon="
                    [
                        'mdi-chart-pie',
                        'mdi-poll',
                        'mdi-chart-timeline-variant-shimmer',
                    ][chartType]
                "
                size="x-large"
                color="primary"
                @click="toggleChartType()"
            ></v-btn>
        </div>
    </div>
    <h1 v-if="!loaded" class="text-[5em]">Loading...</h1>
</template>

<script setup>
import LineChartPage from "./page/LineChartPage.vue";
import PieChartPage from "./page/PieChartPage.vue";
import BarChartRace from "./page/BarChartRacePage.vue";
import { ref, onMounted } from "vue";
import { snowflakeToDate } from "./utils";

let messages = [],
    externalData;

const loaded = ref(false);
const chartType = ref(0);
const totalTypes = 3;

const toggleChartType = () => {
    chartType.value = (chartType.value + 1) % totalTypes;
};

onMounted(async () => {
    const data = await fetch("/assets/data.json")
        .then((response) => response.json())
        .catch((error) => {
            console.error("Error fetching data:", error);
        });

    for (let [channelId, channelData] of Object.entries(data)) {
        for (let message of channelData.messages) {
            message.time = snowflakeToDate(message.id);
            message.channelId = channelId;
            messages.push(message);
        }
    }

    externalData = await fetch("/assets/external.json")
        .then((response) => response.json())
        .catch((error) => {
            console.error("Error fetching data:", error);
        });
    loaded.value = true;
});
</script>
