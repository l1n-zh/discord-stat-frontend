import {
    Root,
    ease,
    Bullet,
    Label,
    ready,
    p100,
    p50,
    array,
    Scrollbar,
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
    series.columns.template.adapters.add("fill", function (fill, target) {
        return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    series.columns.template.adapters.add("stroke", function (stroke, target) {
        return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    // Add label bullet
    series.bullets.push(function () {
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

    const scrollbar = Scrollbar.new(self.root, {
        orientation: "horizontal",
    });

    scrollbar.events.on("rangechanged", (ev) => {
        updateRange(self, { start: ev.start, end: ev.end });
    });

    self.root.container.children.push(scrollbar);

    self.chart = chart;
    self.yAxis = yAxis;
    self.xAxis = xAxis;
    self.series = series;
    self.label = label;
}

function startAnimation(self) {
    let timeIndex = self.indexRange.start;
    updateChart(self, timeIndex, false);
    updateChart(self, ++timeIndex, true);

    self.interval = setInterval(function () {
        ++timeIndex;
        if (timeIndex > self.indexRange.end) {
            stopAnimation(self);
        } else {
            updateChart(self, timeIndex, true);
        }
    }, self.options.stepDuration);

    self.sortInterval = setInterval(function () {
        sortCategoryAxis(self, true);
    }, 50);
}

function stopAnimation(self) {
    clearInterval(self.interval);
    clearInterval(self.sortInterval);
}

function updateChart(self, timeIndex, animationEnable) {
    const { stepDuration, timeDuration, maxRow, timeFormatter } = self.options;

    self.label.set(
        "text",
        `${timeFormatter(
            self.timeRange.start + self.indexRange.start * timeDuration
        )} ~ ${timeFormatter(self.timeRange.start + timeIndex * timeDuration)}`
    );
    let itemsWithNonZero = 0;
    array.each(self.series.dataItems, function (dataItem) {
        let datasetIndex = dataItem.dataContext["datasetIndex"];
        let value =
            self.values[datasetIndex][timeIndex] -
            (self.indexRange.start > 0
                ? self.values[datasetIndex][self.indexRange.start - 1]
                : 0);
        if (value > 0) ++itemsWithNonZero;

        if (!animationEnable) {
            dataItem.set("valueX", value);
            dataItem.set("valueXWorking", value);
        } else {
            dataItem.animate({
                key: "valueX",
                to: value,
                duration: stepDuration,
                easing: ease.linear,
            });
            dataItem.animate({
                key: "valueXWorking",
                to: value,
                duration: stepDuration,
                easing: ease.linear,
            });
        }
    });
    sortCategoryAxis(self, animationEnable);

    self.yAxis.zoom(0, Math.min(itemsWithNonZero, maxRow) / self.yAxis.dataItems.length);
}


function getSeriesItem(self, datasetIndex) {
    return self.series.dataItems.find(
        (item) => item.dataContext.datasetIndex === datasetIndex
    );
}

function sortCategoryAxis(self, animationEnable) {
    const series = self.series;

    // sort by value
    series.dataItems.sort(function (x, y) {
        return y.get("valueX") - x.get("valueX"); // descending
    });

    // go through each axis item
    array.each(self.yAxis.dataItems, function (dataItem) {
        // get corresponding series item
        let seriesDataItem = getSeriesItem(
            self,
            dataItem.dataContext.datasetIndex
        );

        if (seriesDataItem) {
            // get index of series data item
            let index = series.dataItems.indexOf(seriesDataItem);
            // calculate delta position
            let deltaPosition =
                (index - dataItem.get("index", 0)) / series.dataItems.length;
            // set index to be the same as series data item index
            if (dataItem.get("index") != index) {
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
    self.yAxis.dataItems.sort(function (x, y) {
        return x.get("index") - y.get("index");
    });
}

function update(self, datasets, options) {
    self.options = options;
    createChart(self);
    stopAnimation(self);

    const timeRange = getTimeRange(datasets);
    self.indexRange = {
        start: 0,
        end: Math.floor(
            (timeRange.end - timeRange.start) / options.timeDuration
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
                        options.timeDuration
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

    ready(function () {
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
        updateChart(self, self.indexRange.end, false);
        self.series.appear(1000);
        self.chart.appear(1000, 100);
    });
}

function updateRange(self, range) {
    const indexCount = Math.floor(
        (self.timeRange.end - self.timeRange.start) / self.options.timeDuration
    );
    self.indexRange = {
        start: Math.floor(range.start * indexCount),
        end: Math.floor(range.end * indexCount),
    };
    stopAnimation(self);
    updateChart(self, self.indexRange.end);
}

function setMaxRow(self, n) { 
    if (!n || n <= 0) return;
    self.yAxis.zoom(0, n / self.yAxis.dataItems.length);
}

export { update, updateRange, stopAnimation, startAnimation, setMaxRow };
