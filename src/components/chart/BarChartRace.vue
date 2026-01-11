<template>
    <div
        :class="[
            fullScreen
                ? 'w-screen h-screen z-10 bg-white'
                : 'lg:w-[50vw] w-[95vw] h-[50vh]',
            'relative',
        ]"
    >
        <div
            id="chartdiv"
            :class="[fullScreen ? 'h-full' : 'h-[calc(100%-60px)]', 'w-full']"
        ></div>

        <div
            :class="[fullScreen ? '' : '!opacity-100', 'control-bar bg-black']"
        >
            <div class="w-full absolute top-[-16px] left-0">
                <v-slider
                    v-model="timeRangeSelector"
                    color="red"
                    :min="0"
                    :max="100"
                    :step="1"
                ></v-slider>
            </div>
            <v-btn
                density="compact"
                :icon="playing ? 'mdi-pause' : 'mdi-play'"
                variant="text"
                color="white"
                size="x-large"
                @click="togglePlay()"
            ></v-btn>
            <div class="w-[10em] max-h-[90%]">
                <v-select
                    v-model="speedSelector"
                    :items="Object.keys(SPEED_MAP)"
                    label="播放速度"
                    density="compact"
                ></v-select>
            </div>
            <div class="w-[10em] max-h-[90%]">
                <v-select
                    v-model="timeDurationSelector"
                    :items="['日', '週', '月']"
                    label="步進時長"
                    density="compact"
                ></v-select>
            </div>
            <v-btn
                density="compact"
                :icon="fullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
                variant="text"
                color="white"
                size="x-large"
                class="ml-auto"
                @click="fullScreen = !fullScreen"
            ></v-btn>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from "vue";
import {
    Chart,
    setMaxRow,
    update,
    startAnimation,
    stopAnimation,
    setSpeed,
    setTimeDuration,
    setTimeIndex,
    setOnTimeIndexChange,
    setOnEnd,
} from "./chart-race";
import { format, toDate } from "date-fns";

const fullScreen = ref(false);
const playing = ref(false);
let chart;
const speedSelector = ref("1x");
const timeDurationSelector = ref("日");
const timeRangeSelector = ref(0);
const isUpdatingFromCallback = ref(false);
const SPEED_MAP = {
    "0.5x": 0.5,
    "1x": 1,
    "2x": 2,
    "4x": 4,
};

const TIME_DURATION_MAP = {
    日: 1000 * 60 * 60 * 24,
    週: 1000 * 60 * 60 * 24 * 7,
    月: 1000 * 60 * 60 * 24 * 30.4375,
};

const BASE_STEP_DURATION_MAP = {
    日: 200,
    週: 200 * 7,
    月: 200 * 30.4375,
};

let { data, timeLabels } = defineProps(["data", "timeLabels"]);

function setDatasets(datasets, topN) {
    update(chart, datasets, {
        baseStepDuration: BASE_STEP_DURATION_MAP[timeDurationSelector.value],
        timeDuration: TIME_DURATION_MAP[timeDurationSelector.value],
        maxRow: topN,
        timeFormatter: (timestamp) => format(timestamp, "yyyy/MM/dd"),
    });
    
    // 更新初始進度條位置到起始位置
    // 使用 nextTick 確保 update 函數執行完成後再更新
    nextTick(() => {
        if (chart.indexRange) {
            isUpdatingFromCallback.value = true;
            timeRangeSelector.value = 0;
            playing.value = false;
            nextTick(() => {
                isUpdatingFromCallback.value = false;
            });
        }
    });
}

function setTopN(n) {
    setMaxRow(chart, n);
}

onMounted(() => {
    chart = new Chart("chartdiv");

    setOnEnd(chart, () => {
        playing.value = false;
    });
});

function togglePlay() {
    if (playing.value) {
        stopAnimation(chart);
        // 停止播放時清除回調
        setOnTimeIndexChange(chart, null);
    } else {
        setOnTimeIndexChange(chart, (timeIndex, indexRange) => {
            if (!playing.value) return; // 如果已經停止播放，不更新
            
            const { start, end } = indexRange;
            
            const totalRange = end - start;
            const percentage = totalRange > 0 
                ? ((timeIndex - start) / totalRange) * 100 
                : 0;
            
            // 設置 flag 避免觸發 watch
            isUpdatingFromCallback.value = true;
            timeRangeSelector.value = Math.min(100, Math.max(0, percentage));
            // 使用 nextTick 確保在 watch 執行後重置 flag
            nextTick(() => {
                isUpdatingFromCallback.value = false;
            });
        });
        startAnimation(chart);
    }
    playing.value = !playing.value;
}

// Watch speedSelector
watch(speedSelector, (newSpeed) => {
    setSpeed(chart, SPEED_MAP[newSpeed]);
});

// Watch timeDurationSelector
watch(timeDurationSelector, (newDuration) => {
    setTimeDuration(
        chart,
        TIME_DURATION_MAP[newDuration],
        BASE_STEP_DURATION_MAP[newDuration]
    );
});

// Watch timeRangeSelector
watch(
    timeRangeSelector,
    (percentage) => {
        // 如果正在從回調更新，跳過以避免循環
        if (isUpdatingFromCallback.value) {
            return;
        }

        // 將 slider 的百分比值轉換為實際的 timeIndex
        const { start, end } = chart.indexRange;
        const totalRange = end - start;
        const index = Math.floor(start + (percentage / 100) * totalRange);

        setTimeIndex(chart, index);
    }
);

defineExpose({ setDatasets, setTopN });
</script>

<style scoped>
.control-bar {
    height: 60px;
    width: 100%;
    display: flex;
    align-items: center;
    user-select: none;
    position: absolute;
    bottom: 0;
    opacity: 0;
    transition: opacity 0.3s;
    padding-left: 0.5em;
    padding-right: 0.5em;
    gap: 1em;
}

/* hover:opacity-100 doesn't work, idk why */
.control-bar:hover {
    opacity: 1;
}
</style>
