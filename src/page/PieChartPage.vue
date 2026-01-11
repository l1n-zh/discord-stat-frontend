<template>
    <div class="flex items-center flex-col lg:flex-row">
        <PieChart ref="chart"></PieChart>
        <div class="lg:w-[60%] w-[95%]">
            <v-number-input
                label="TOP N"
                v-model="topN"
                :min="1"
                variant="outlined"
            ></v-number-input>

            <Filter
                label="channel"
                :items="externalData.channels"
                :filter="ChannelIdFilter"
                :callback="addFilter"
            >
            </Filter>

            <Filter
                label="user"
                :items="externalData.users"
                :filter="AuthorFilter"
                :callback="addFilter"
            ></Filter>

            <Filter
                label="time of day"
                :items="generate24HourArray()"
                :filter="TimeOfDayFilter"
                :callback="addFilter"
            ></Filter>

            <div class="flex sm:flex-row flex-col gap-2">
                <v-btn-toggle
                    v-model="baseOn"
                    variant="outlined"
                    divided
                    class="block w-full"
                >
                    <v-btn :value="0">
                        <v-icon start> mdi-forum </v-icon>
                        <span class="hidden-sm-and-down">Channel</span>
                    </v-btn>

                    <v-btn :value="1">
                        <v-icon start> mdi-account </v-icon>
                        <span class="hidden-sm-and-down">User</span>
                    </v-btn>

                    <v-btn :value="2">
                        <v-icon start> mdi-clock </v-icon>
                        <span class="hidden-sm-and-down">Time Of Day</span>
                    </v-btn>
                </v-btn-toggle>

                <v-btn
                    @click="submit()"
                    append-icon="mdi-chart-pie"
                    color="secondary"
                    class="float-right w-full sm:w-auto"
                    size="x-large"
                    >submit</v-btn
                >
            </div>
        </div>
    </div>
</template>

<script setup>
import PieChart from "@/components/chart/PieChart.vue";
import Filter from "@/components/Filter.vue";
import { ref, onMounted, watch } from "vue";
import {
    query,
    ChannelIdFilter,
    AuthorFilter,
    TimeOfDayFilter,
} from "@/components/filter";
import { generate24HourArray, truncateString } from "../utils.js";

const { messages, externalData } = defineProps(["messages", "externalData"]);

const chart = ref(null);
const baseOn = ref(0);
let filters = {};
const addFilter = (filter) => (filters[filter.name] = filter);

const topN = ref(20);
let dataCache;

onMounted(() => {
    submit();
});

watch(topN, () => {
    if (dataCache && baseOn.value !== 2) {
        const [labels, data] = dataCache;
        const [processedLabels, processedData] = applyTopN(
            labels,
            data,
            topN.value
        );
        chart.value.setData({
            labels: processedLabels,
            datasets: [
                {
                    label: "message count",
                    data: processedData,
                },
            ],
        });
    }
});

function submit() {
    const [labels, data] = getData();
    dataCache = [labels, data];
    
    let processedLabels, processedData;
    if (baseOn.value === 2) {
        // Time Of Day 不使用 TopN
        processedLabels = labels;
        processedData = data;
    } else {
        [processedLabels, processedData] = applyTopN(
            labels,
            data,
            topN.value
        );
    }

    chart.value.setData({
        labels: processedLabels,
        datasets: [
            {
                label: "message count",
                data: processedData,
            },
        ],
    });
}

function baseOnDayOfTime(messageData) {
    let messageCounts = [];
    let labels = [];
    for (let hourData of generate24HourArray()) {
        const count = messageData.filter(
            (msg) => new Date(msg.time).getHours() === hourData.value
        ).length;
        if (count > 0) {
            messageCounts.push(count);
            labels.push(hourData.title + " (" + hourData.subtitle + ")");
        }
    }
    return [labels, messageCounts];
}

function baseOnAuthor(messageData) {
    let messageCounts = [];
    let labels = [];
    for (let userData of externalData.users) {
        const count = messageData.filter(
            (msg) => msg.authorId === userData.value
        ).length;
        if (count > 0) {
            messageCounts.push(count);
            labels.push(
                truncateString(userData.title, 15) +
                    " ( " +
                    userData.subtitle +
                    " )"
            );
        }
    }
    return sort(labels, messageCounts);
}

function baseOnChannel(messageData) {
    let messageCounts = [];
    let labels = [];
    for (let channelData of externalData.channels) {
        const count = messageData.filter(
            (msg) => msg.channelId === channelData.value
        ).length;
        if (count > 0) {
            messageCounts.push(count);
            labels.push(truncateString(channelData.title, 15));
        }
    }
    return sort(labels, messageCounts);
}

function sort(arr1, arr2) {
    const indices = Array.from(arr2.keys());
    indices.sort((a, b) => arr2[b] - arr2[a]);
    return [indices.map((i) => arr1[i]), indices.map((i) => arr2[i])];
}

function getData() {
    const baseOnFunction = [baseOnChannel, baseOnAuthor, baseOnDayOfTime][
        baseOn.value
    ];
    return baseOnFunction(query(messages, Object.values(filters)));
}

function applyTopN(labels, data, n) {
    if (labels.length <= n) {
        return [labels, data];
    }

    const topLabels = labels.slice(0, n);
    const topData = data.slice(0, n);
    const remainingData = data.slice(n);
    const remainingSum = remainingData.reduce((sum, val) => sum + val, 0);

    if (remainingSum > 0) {
        topLabels.push("其他");
        topData.push(remainingSum);
    }

    return [topLabels, topData];
}
</script>
