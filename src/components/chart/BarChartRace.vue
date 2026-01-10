<template>
    <div id="chartdiv" class="w-full h-[100vh]"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { Chart, setMaxRow, update } from "./chart-race";
import { format, toDate } from "date-fns";

let chart;

let { data, timeLabels } = defineProps(["data", "timeLabels"]);
// TODO: adjustable options
const options = {
    stepDuration: 10000,
    timeDuration: 1000 * 60 * 60 * 24 * 30.4375,
    maxRow: 30,
    timeFormatter: (timestamp) => format(timestamp, "yyyy MMM"),
};

const options2 = {
    stepDuration: 1000,
    timeDuration: 1000 * 60 * 60 * 24,
    maxRow: 10,
    timeFormatter: (timestamp) => format(timestamp, "yyyy/MM/dd"),
};

function setDatasets(datasets, topN) {
    update(chart, datasets, {
        stepDuration: 10000,
        timeDuration: 1000 * 60 * 60 * 24 * 30.4375,
        maxRow: topN,
        timeFormatter: (timestamp) => format(timestamp, "yyyy/MM/dd"),
    });
}

function setTopN(n) {
    setMaxRow(chart, n);
}

onMounted(() => {
    chart = new Chart("chartdiv");
});

stopAnimation(self);
startAnimation(self);

defineExpose({ setDatasets, setTopN });
</script>
