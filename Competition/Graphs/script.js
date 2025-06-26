const chart = document.querySelector("#chart canvas");

const asiaData = [
  { year: 2016, count: 17.99 },
  { year: 2017, count: 17.62 },
  { year: 2018, count: 17.76 },
  { year: 2019, count: 17.38 },
  { year: 2020, count: 18.28 },
  { year: 2021, count: 18.92 },
  { year: 2022, count: 19.13 },
];

const myData = [
  { year: 2016, count: 0.7 },
  { year: 2017, count: 0.6 },
  { year: 2018, count: 0.7 },
  { year: 2019, count: 1 },
  { year: 2020, count: 1.4 },
  { year: 2021, count: 1.4 },
  { year: 2022, count: 7.15 },

];

// Total duration for the animation in milliseconds
const totalDuration = 3000;

// Calculate the delay between points based on the total duration and the number of data points
const delayBetweenPoints = totalDuration / asiaData.length;

// Function to determine the starting Y position for animations
const previousY = (ctx) => (
    ctx.index === 0 
        ? ctx.chart.scales.y.getPixelForValue(100) // Start at a fixed value for the first point
        : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(["y"], true).y // Use the previous point's Y position
);

// Function to render the chart
function showChart() {
    new Chart(chart, {
        type: "bar", // Specify the chart type as a line chart
        data: {
            // Use the years from asiaData as labels for the x-axis
            labels: asiaData.map((r) => r.year),
            datasets: [
                {
                    label: "Asia", // Label for the Asia dataset
                    borderColor: "#AEC6CF", // Line color for Asia
                    borderWidth: 4, // Line thickness
                    radius: 0, // No points on the line
                    data: asiaData.map((r) => r.count), // Use the counts from asiaData
                },
                {
                    label: "Malaysia", // Label for the Malaysia dataset
                    borderColor: "#FAC898", // Line color for Malaysia
                    borderWidth: 4, // Line thickness
                    radius: 0, // No points on the line
                    data: myData.map((r) => r.count), // Use the counts from myData
                },
            ],
        },
        options: {
            plugins: {
                legend: {
                    display: true, // Show the legend
                    position: "top", // Position the legend at the top
                    labels: {
                        font: {size: 12}, // Font size for legend labels
                        boxWidth: 12, // Width of the legend color box
                    },
                },
            },
            scales: {
                x: {
                    type: "category", // Treat the x-axis labels as categories
                },
            },
            // tension: 0.4, // Add a slight curve to the lines
            // animation: {
            //     x: {
            //         type: "number", // Animate the x-axis
            //         easing: "linear", // Use linear easing for smooth animation
            //         duration: delayBetweenPoints, // Duration for each point
            //         from: NaN, // Start from an undefined position
            //         delay(chart) {
            //             // Delay the animation for each point
            //             if (chart.type !== "data" || chart.xStarted) {
            //                 return 0;
            //             }
            //             chart.xStarted = true;
            //             return chart.index * delayBetweenPoints;
            //         },
            //     },
            //     y: {
            //         type: "number", // Animate the y-axis
            //         easing: "linear", // Use linear easing for smooth animation
            //         duration: delayBetweenPoints, // Duration for each point
            //         from: previousY, // Start from the previous Y position
            //         delay(chart) {
            //             // Delay the animation for each point
            //             if (chart.type !== "data" || chart.yStarted) {
            //                 return 0;
            //             }
            //             chart.yStarted = true;
            //             return chart.index * delayBetweenPoints;
            //         },
            //     },
            // },
            interaction: {
                intersect: false, // Disable intersection-based highlighting
            },
        },
    });
}

// Call the function to render the chart
showChart();