import {
    Root,
    ease,
    Bullet,
    Label,
    ready,
    p100,
    p50,
    array,
} from "@amcharts/amcharts5/index";
import {
    ColumnSeries,
    AxisRendererY,
    AxisRendererX,
    XYChart,
    CategoryAxis,
    ValueAxis,
} from "@amcharts/amcharts5/xy";
import AnimatedTheme from "@amcharts/amcharts5/themes/Animated";

export class Chart {
    constructor(element) {
        const root = Root.new(element);

        // Set themes
        // https://www.amcharts.com/docs/v5/concepts/themes/
        root.setThemes([AnimatedTheme.new(root)]);
        // Create chart
        // https://www.amcharts.com/docs/v5/charts/xy-chart/
        this.root = root;
    }
}

function getTimeRange(datasets) {
    let minTime = Infinity;
    let maxTime = -Infinity;

    for (const dataset of datasets) {
        const firstX = dataset.data[0].x;
        const lastX = dataset.data[dataset.data.length - 1].x;

        minTime = Math.min(minTime, firstX);
        maxTime = Math.max(maxTime, lastX);
    }
    return { start: minTime, end: maxTime };
}

function createChart(self) {
    self.timeIndex = null;
    self.activeAnimations = [];
    self.onTimeIndexChange = null;

    const root = self.root;
    root.container.children.clear();
    const chart = root.container.children.push(
        XYChart.new(root, {
            panX: true,
            panY: true,
            wheelX: "none",
            wheelY: "none",
            paddingLeft: 0,
        })
    );

    // We don't want zoom-out button to appear while animating, so we hide it at all
    chart.zoomOutButton.set("forceHidden", true);

    // Create axes
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    const yRenderer = AxisRendererY.new(root, {
        minGridDistance: 20,
        inversed: true,
        minorGridEnabled: true,
    });
    // hide grid
    yRenderer.grid.template.set("visible", false);

    const yAxis = chart.yAxes.push(
        CategoryAxis.new(root, {
            maxDeviation: 0,
            categoryField: "label",
            renderer: yRenderer,
        })
    );

    const xAxis = chart.xAxes.push(
        ValueAxis.new(root, {
            maxDeviation: 0,
            min: 0,
            strictMinMaxSelection: true,
            extraMax: 0.1,
            renderer: AxisRendererX.new(root, {}),
        })
    );

    // xAxis.set("interpolationDuration", self.stepDuration / 10);
    // xAxis.set("interpolationEasing", ease.linear);

    // Add series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    const series = chart.series.push(
        ColumnSeries.new(root, {
            xAxis: xAxis,
            yAxis: yAxis,
            valueXField: "value",
            categoryYField: "label",
        })
    );

    // Rounded corners for columns
    series.columns.template.setAll({
        cornerRadiusBR: 1,
        cornerRadiusTR: 1,
    });

    // Make each column to be of a different color
    series.columns.template.adapters.add("fill", (fill, target) => {
        return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    series.columns.template.adapters.add("stroke", (stroke, target) => {
        return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    // Add label bullet
    series.bullets.push(() => {
        return Bullet.new(root, {
            locationX: 1,
            sprite: Label.new(root, {
                text: "{valueXWorking.formatNumber('#.')}",
                fill: "black",
                centerY: p50,
                populateText: true,
            }),
        });
    });

    const label = chart.plotContainer.children.push(
        Label.new(root, {
            fontSize: "3em",
            opacity: 0.2,
            x: p100,
            y: p100,
            centerY: p100,
            centerX: p100,
        })
    );

    self.chart = chart;
    self.yAxis = yAxis;
    self.xAxis = xAxis;
    self.series = series;
    self.label = label;
}

function _startSortInterval(self) {
    if (self.sortInterval) {
        _clearSortInterval(self);
    }
    self.sortInterval = setInterval(() => {
        sortCategoryAxis(self, true);
    }, 50);
}

function startAnimation(self) {
    if (self.timeIndex == null) {
        self.timeIndex = self.indexRange.start;
        _updateChart(self, self.timeIndex, false);
    }

    if (!self.config.speed) {
        self.config.speed = 1;
    }
    self.stepDuration = self.config.baseStepDuration / self.config.speed;

    if (self.timeIndex < self.indexRange.end) {
        _updateChart(self, ++self.timeIndex, true);
    }

    if (self.interval) clearInterval(self.interval);
    self.interval = setInterval(() => {
        ++self.timeIndex;
        if (self.timeIndex > self.indexRange.end) {
            _clearInterval(self);
            _clearSortInterval(self);
            self.timeIndex = null;
            if (self.onEnd) {
                self.onEnd();
            }
        } else {
            _updateChart(self, self.timeIndex, true);
        }
    }, self.stepDuration);

    if (!self.sortInterval) {
        _startSortInterval(self);
    }
}

function _clearAnimations(self) {
    if (self.activeAnimations) {
        self.activeAnimations.forEach((animation) => {
            if (animation) {
                animation.stop();
            }
        });
        self.activeAnimations = [];
    }
}

function _clearInterval(self) {
    clearInterval(self.interval);
    self.interval = null;
}

function _clearSortInterval(self) {
    clearInterval(self.sortInterval);
    self.sortInterval = null;
}

function stopAnimation(self) {
    // DO NOT clear sortInterval!
    _clearInterval(self);
    _clearAnimations(self);
}

function _updateChart(self, timeIndex, animationEnable) {
    /*
     * 會有使用 self.timeIndex 以外的場合
     * 如: _updateChart(self, self.timeIndex, true);
     * 因此需要 timeIndex 參數
     */
    const { timeDuration, maxRow, timeFormatter } = self.config;

    // 清理已完成的動畫引用（只保留正在進行的）
    if (self.activeAnimations) {
        self.activeAnimations = self.activeAnimations.filter((anim) => {
            return anim && !anim.isFinished && !anim.isKilled;
        });
    }

    self.label.set(
        "text",
        `${timeFormatter(
            self.timeRange.start + self.indexRange.start * timeDuration
        )} ~ ${timeFormatter(self.timeRange.start + timeIndex * timeDuration)}`
    );
    /**
     * 可考慮只更新 maxRow 的數量就好
     * 節省計算資源，缺點是如果用戶將圖表向下捲動，會看到空白
     */
    array.each(self.series.dataItems, (dataItem) => {
        let datasetIndex = dataItem.dataContext["datasetIndex"];
        let value =
            self.values[datasetIndex][timeIndex] -
            (self.indexRange.start > 0
                ? self.values[datasetIndex][self.indexRange.start - 1]
                : 0);

        if (!animationEnable || value === 0) {
            dataItem.set("valueX", value);
            dataItem.set("valueXWorking", value);
        } else {
            const anim1 = dataItem.animate({
                key: "valueX",
                to: value,
                duration: self.stepDuration,
                easing: ease.linear,
            });
            const anim2 = dataItem.animate({
                key: "valueXWorking",
                to: value,
                duration: self.stepDuration,
                easing: ease.linear,
            });
            if (anim1) self.activeAnimations.push(anim1);
            if (anim2) self.activeAnimations.push(anim2);
        }
    });
    // Don't need to call sortCategoryAxis here, it will be called periodically by setInterval.

    if (self.onTimeIndexChange) {
        self.onTimeIndexChange(timeIndex, self.indexRange);
    }
}

function getSeriesItem(self, datasetIndex) {
    return self.series.dataItems.find(
        (item) => item.dataContext.datasetIndex === datasetIndex
    );
}

function sortCategoryAxis(self, animationEnable) {
    const series = self.series;

    // sort by value
    series.dataItems.sort((x, y) => {
        return y.get("valueX") - x.get("valueX"); // descending
    });

    // go through each axis item
    array.each(self.yAxis.dataItems, (dataItem) => {
        // get corresponding series item
        let seriesDataItem = getSeriesItem(
            self,
            dataItem.dataContext.datasetIndex
        );

        if (seriesDataItem) {
            // get index of series data item
            const index = series.dataItems.indexOf(seriesDataItem);
            let currentIndex = dataItem.get("index");
            if (currentIndex === undefined) {
                currentIndex = self.yAxis.dataItems.indexOf(dataItem);
                dataItem.set("index", currentIndex);
            }
            // calculate delta position
            let deltaPosition =
                (index - currentIndex) / series.dataItems.length;
            // set index to be the same as series data item index
            if (currentIndex != index) {
                dataItem.set("index", index);
                // set deltaPosition instanlty
                dataItem.set("deltaPosition", -deltaPosition);
                // animate delta position to 0
                if (animationEnable) {
                    dataItem.animate({
                        key: "deltaPosition",
                        to: 0,
                        duration: 1000,
                        easing: ease.out(ease.cubic),
                    });
                } else {
                    dataItem.set("deltaPosition", 0);
                }
            }
        }
    });
    // sort axis items by index.
    // This changes the order instantly, but as deltaPosition is set, they keep in the same places and then animate to true positions.
    self.yAxis.dataItems.sort((x, y) => {
        return x.get("index") - y.get("index");
    });
}

function update(self, datasets, config) {
    self.config = config;

    self.config.baseStepDuration = config.baseStepDuration;
    self.datasets = datasets; // 保存 datasets 以供後續使用
    createChart(self);
    _clearInterval(self);
    _clearSortInterval(self);

    const timeRange = getTimeRange(datasets);
    self.indexRange = {
        start: 0,
        end: Math.floor(
            (timeRange.end - timeRange.start) / config.timeDuration
        ),
    };
    self.timeRange = timeRange;

    let values = [];

    for (const [index, dataset] of datasets.entries()) {
        values[index] = [];
        for (let i = 0; i < dataset.data.length; ++i) {
            values[index][
                Math.floor(
                    (dataset.data[i].x - self.timeRange.start) /
                        config.timeDuration
                )
            ] = dataset.data[i].y;
        }
        fillEmpty(values[index], self.indexRange.end + 1);
    }

    function fillEmpty(arr, n) {
        let lastValue = 0;
        for (let i = 0; i < n; ++i) {
            if (arr[i] === undefined) arr[i] = lastValue;
            else {
                lastValue = arr[i];
            }
        }
    }
    self.values = values;

    ready(() => {
        for (const [index, dataset] of datasets.entries()) {
            self.series.data.push({
                label: dataset.label,
                datasetIndex: index,
                value: 0,
            });
            self.yAxis.data.push({
                label: dataset.label,
                datasetIndex: index,
            });
        }
        // 設置初始 timeIndex 為結束位置（顯示最終狀態）
        _updateChart(self, self.indexRange.end, false);
        self.series.appear(1000);
        self.chart.appear(1000, 100);

        _startSortInterval(self);
    });
}

function setMaxRow(self, n) {
    self.config.maxRow = n;
    self.yAxis.zoom(0, n / self.yAxis.dataItems.length);
}

function setSpeed(self, speed) {
    self.config.speed = speed;

    // 如果正在播放，重新啟動 interval
    if (self.interval) {
        const currentIndex = self.timeIndex;

    //     // DO NOT clear sortInterval!
        _clearInterval(self);

        _clearAnimations(self);
        self.timeIndex = currentIndex - 1;
        startAnimation(self);
    }
}

function recalculateValues(self, datasets) {
    const timeRange = self.timeRange;
    const timeDuration = self.config.timeDuration;

    self.indexRange = {
        start: 0,
        end: Math.floor((timeRange.end - timeRange.start) / timeDuration),
    };

    let values = [];

    for (const [index, dataset] of datasets.entries()) {
        values[index] = [];
        for (let i = 0; i < dataset.data.length; ++i) {
            values[index][
                Math.floor((dataset.data[i].x - timeRange.start) / timeDuration)
            ] = dataset.data[i].y;
        }
        fillEmpty(values[index], self.indexRange.end + 1);
    }

    function fillEmpty(arr, n) {
        let lastValue = 0;
        for (let i = 0; i < n; ++i) {
            if (arr[i] === undefined) arr[i] = lastValue;
            else {
                lastValue = arr[i];
            }
        }
    }

    self.values = values;
}

function setTimeDuration(self, duration, baseStepDuration) {
    const wasPlaying = self.interval !== null;

    self.config.timeDuration = duration;
    if (baseStepDuration) {
        self.config.baseStepDuration = baseStepDuration;
    }

    // 重新計算資料結構
    if (self.datasets && self.timeRange) {
        const indexRatio = self.timeIndex / self.indexRange.end;
        recalculateValues(self, self.datasets);
        if (self.timeIndex !== null) {
            self.timeIndex = Math.round(indexRatio * self.indexRange.end);
            _updateChart(self, self.timeIndex, false);

            if (wasPlaying) {
                startAnimation(self);
            }
        }
    }
}

function setTimeIndex(self, index) {
    if (index === null || index === undefined) return;

    index = Math.max(
        self.indexRange.start,
        Math.min(index, self.indexRange.end)
    );

    const wasPlaying = self.interval !== null;

    if (wasPlaying) {
        _clearInterval(self);
        _clearAnimations(self);
    }

    self.timeIndex = index;
    _updateChart(self, index, false);

    if (wasPlaying) {
        startAnimation(self);
    }
}

function setOnTimeIndexChange(self, callback) {
    self.onTimeIndexChange = callback;
}

function setOnEnd(self, callback) {
    self.onEnd = callback;
}

export {
    update,
    stopAnimation,
    startAnimation,
    setMaxRow,
    setSpeed,
    setTimeDuration,
    setTimeIndex,
    setOnTimeIndexChange,
    setOnEnd,
};
