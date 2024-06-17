<template>
    <div class="flex items-center">
        <PieChart ref="chart"></PieChart>

        <div class="lg:w-[60%] w-[90%]">
            <Filter label="channel" :items="externalData.channels" :filter="ChannelIdFilter"
                :callback="filterInstance => channelIdFilterInstance = filterInstance">
            </Filter>

            <Filter label="user" :items="externalData.users" :filter="AuthorFilter"
                :callback="filterInstance => authorFilterInstance = filterInstance"></Filter>

            <Filter label="time of day" :items="generate24HourArray()" :filter="TimeOfDayFilter"
                :callback="filterInstance => timeOfDayFilterInstance = filterInstance"></Filter>


            <v-btn-toggle v-model="baseOn" variant="outlined" divided>
                <v-btn :value="0">
                    <v-icon start>
                        mdi-forum
                    </v-icon>
                    <span class="hidden-sm-and-down">Channel</span>
                </v-btn>

                <v-btn :value="1">
                    <v-icon start>
                        mdi-account
                    </v-icon>
                    <span class="hidden-sm-and-down">User</span>
                </v-btn>

                <v-btn :value="2">
                    <v-icon start>
                        mdi-clock
                    </v-icon>
                    <span class="hidden-sm-and-down">Time Of Day</span>
                </v-btn>
            </v-btn-toggle>

            <v-btn @click="submit()" variant="tonal" append-icon="mdi-chart-pie" class="float-right"
                size="x-large">submit</v-btn>
        </div>
    </div>
</template>

<script setup>
import PieChart from '@/components/chart/PieChart.vue'
import Filter from '@/components/Filter.vue';
import { ref, onMounted } from 'vue'
import { query, ChannelIdFilter, AuthorFilter, TimeOfDayFilter } from '@/components/filter'
import { generate24HourArray } from '../utils.js'


let channelIdFilterInstance, authorFilterInstance, timeOfDayFilterInstance; // TODO

const { rawData, externalData } = defineProps(['rawData', 'externalData'])

const chart = ref(null)
const baseOn = ref(0)

function submit() {
    const [labels, data] = getData()

    chart.value.setData({
        labels: labels, datasets: [{
            label: 'message count',
            data: data
        }]
    })
}

function baseOnDayOfTime(messages) {
    let messageCounts = [];
    let labels = [];
    for (let hourData of generate24HourArray()) {
        const count = messages.filter(message => message.time.getHours() === hourData.value).length
        if (count > 0) {
            messageCounts.push(count)
            labels.push(hourData.title)
        }
    }
    return [labels, messageCounts];
}

function baseOnAuthor(messages) {
    let messageCounts = [];
    let labels = [];
    for (let userData of externalData.users) {
        const count = messages.filter(message => message.authorId === userData.value).length
        if (count > 0) {
            messageCounts.push(count)
            labels.push(userData.title)
        }
    }
    return sort(labels, messageCounts);
}

function baseOnChannel(messages) {
    let messageCounts = [];
    let labels = [];
    for (let channelData of externalData.channels) {
        const count = messages.filter(message => message.channelId === channelData.value).length;
        if (count > 0) {
            messageCounts.push(count)
            labels.push(channelData.title)
        }
    }
    return sort(labels, messageCounts);
}

function sort(arr1, arr2) {
    const indices = Array.from(arr2.keys())
    indices.sort((a, b) => arr2[b] - arr2[a])
    return[indices.map(i => arr1[i]),indices.map(i => arr2[i])]
}

function getData() {
    const baseOnFunction = [baseOnChannel, baseOnAuthor, baseOnDayOfTime][baseOn.value]
    return baseOnFunction(query(rawData, [channelIdFilterInstance], [authorFilterInstance, timeOfDayFilterInstance]))
}

</script>