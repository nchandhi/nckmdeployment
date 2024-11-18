import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';

interface ChartProps {
  instruction: any; // Adjust this type to match the structure of your instruction
  data: any;        // Adjust this type to match the structure of your chart_data
}

const Chart: React.FC<ChartProps> = ({ instruction, data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (chartRef.current && instruction && data) {
      ChartJS.register(...registerables);

      const chartType = instruction.chart_type; // Line, bar, pie, etc.
      const labels = data.map((item: any) => item[instruction.x_field]);
      const dataset = data.map((item: any) => item[instruction.y_field]);

      const myChart = new ChartJS(chartRef.current, {
        type: chartType,
        data: {
          labels: labels,
          datasets: [{
            label: instruction.metric, // Chart label or metric
            data: dataset,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

      return () => {
        myChart.destroy(); // Cleanup when component unmounts or updates
      };
    }
  }, [instruction, data]);

  return <canvas ref={chartRef} />;
};

export default Chart;
