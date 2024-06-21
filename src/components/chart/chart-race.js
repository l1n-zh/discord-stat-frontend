import { Root, ease, Bullet, Label, ready, p100, p50, array } from "@amcharts/amcharts5/index";
import { ColumnSeries, AxisRendererY, AxisRendererX, XYChart, CategoryAxis, ValueAxis } from "@amcharts/amcharts5/xy";
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

    createChart() {
        const root = this.root;
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
                strictMinMax: true,
                extraMax: 0.1,
                renderer: AxisRendererX.new(root, {}),
            })
        );

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

        series.columns.template.adapters.add(
            "stroke",
            function (stroke, target) {
                return chart
                    .get("colors")
                    .getIndex(series.columns.indexOf(target));
            }
        );

        // Add label bullet
        series.bullets.push(function () {
            return Bullet.new(root, {
                locationX:1,
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
                fontSize: "6em",
                opacity: 0.2,
                x: p100,
                y: p100,
                centerY: p100,
                centerX: p100,
            })
        );

        this.chart = chart;
        this.yAxis = yAxis;
        this.series = series;
        this.label = label
    }


    update(datasets, options) {
        const { stepDuration, timeDuration, maxRow, timeFormatter } = options;
        this.createChart();
        clearInterval(this.interval)
        clearInterval(this.sortInterval)
        const [startTime, endTime] = getTimeRange(datasets);
        let values = [];
        for (const [index, dataset] of datasets.entries()) {
            values[index] = [];
            for (let i = 1; i <= dataset.data.length; ++i) {
                values[index][
                    Math.floor(
                        (dataset.data[i - 1].x - startTime) / timeDuration
                    )
                ] = dataset.data[i - 1].y;
            }
        }

        const self = this;
        ready(function () {
            // Create root element
            // https://www.amcharts.com/docs/v5/getting-started/#Root_element
            // Get series item by category
            let timeIndex = 0;
            let indexMax = 600;

            // update data with values each 1.5 sec
            self.interval = setInterval(function () {
                ++timeIndex;
                if (timeIndex > indexMax) {
                    clearInterval(self.interval);
                    clearInterval(self.sortInterval);
                }

                updateData(timeIndex);
            }, stepDuration);

            self.sortInterval = setInterval(function () {
                sortCategoryAxis(self.series, self.yAxis);
            }, 50);

            function setInitialData() {
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
            }

            const lastValue = [];
            function updateData(timeIndex) {
                self.label.set("text", timeFormatter(startTime+timeIndex*timeDuration));
                let itemsWithNonZero = 0;

                array.each(self.series.dataItems, function (dataItem) {
                    let datasetIndex = dataItem.dataContext["datasetIndex"];
                    let value = values[datasetIndex][timeIndex]
                    if (value === undefined) {
                        value = datasetIndex in lastValue ? lastValue[datasetIndex] : 0;
                    } else {
                        lastValue[datasetIndex] = value;
                    }
                    if (value > 0) ++itemsWithNonZero;
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
                });
                self.yAxis.zoom(0, Math.min(maxRow,itemsWithNonZero) / self.yAxis.dataItems.length);
            }
            setInitialData();
            setTimeout(function () {
                updateData(0);
            }, 50);

            self.series.appear(1000);
            self.chart.appear(1000, 100);
        });
    }
}

function getSeriesItem(series, category) {
    for (let i = 0; i < series.dataItems.length; i++) {
        let dataItem = series.dataItems[i];
        if (dataItem.get("categoryY") == category) {
            return dataItem;
        }
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
    return [minTime, maxTime];
}


function sortCategoryAxis(series, yAxis) {
        // sort by value
        series.dataItems.sort(function (x, y) {
            return y.get("valueX") - x.get("valueX"); // descending
        });

        // go through each axis item
        array.each(yAxis.dataItems, function (dataItem) {
            // get corresponding series item
            let seriesDataItem = getSeriesItem(series, dataItem.get("category"));

            if (seriesDataItem) {
                // get index of series data item
                let index = series.dataItems.indexOf(seriesDataItem);
                // calculate delta position
                let deltaPosition =
                    (index - dataItem.get("index", 0)) /
                    series.dataItems.length;
                // set index to be the same as series data item index
                if (dataItem.get("index") != index) {
                    dataItem.set("index", index);
                    // set deltaPosition instanlty
                    dataItem.set("deltaPosition", -deltaPosition);
                    // animate delta position to 0
                    dataItem.animate({
                        key: "deltaPosition",
                        to: 0,
                        duration: 1000,
                        easing: ease.out(ease.cubic),
                    });
                }
            }
        });
        // sort axis items by index.
        // This changes the order instantly, but as deltaPosition is set, they keep in the same places and then animate to true positions.
        yAxis.dataItems.sort(function (x, y) {
            return x.get("index") - y.get("index");
        });
    }