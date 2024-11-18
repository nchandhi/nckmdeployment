import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface DonutChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  title: string;
  containerHeight: number;
  widthInPixels: number;
  containerID: string;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  containerHeight,
  containerID,
}) => {
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [centerText, setCenterText] = useState({
    label: "Positive",
    percentage: (
      ((data.find((d) => d.label === "positive")?.value || 0) /
        d3.sum(data, (d) => d.value)) *
      100
    ).toFixed(0),
  });

  useEffect(() => {
    const containerWidth =
      document?.getElementById(containerID)!.clientWidth || 200;
    const donutWidthAndHeight =
      (containerHeight > containerWidth ? containerWidth : containerHeight) /
      1.7;
    const width = donutWidthAndHeight; // Set width equal to containerHeight for a square layout
    const radius = width / 2;
    const svgHeight = donutWidthAndHeight;
    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${svgHeight / 2})`);

    const pie = d3
      .pie<any>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<any>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    svg
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("class", "arc")
      .attr("d", arc)
      .attr("fill", (d: any) => d.data.color)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        const percentage = (
          (d.data.value / d3.sum(data, (d) => d.value)) *
          100
        ).toFixed(0);
        setCenterText({ label: d.data.label, percentage });
      });

    return () => {
      d3.select(chartRef.current).selectAll("*").remove();
    };
  }, [data, containerHeight]);
  return (
    <div style={styles.container}>
      <div style={styles.legend}>
        {data.map((item) => (
          <div
            className="labelContainer"
            key={item.label}
            style={styles.legendItem}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: item.color,
                marginRight: "8px",
                borderRadius: "2px",
              }}
            />
            <span className="donut-label" style={styles.labelText}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div style={styles.chartOuterContainer}>
        <svg ref={chartRef} />
        <div style={styles.centerText}>
          <div
            style={{
              ...styles.percentageText,
              fontSize: `${containerHeight / 160}rem`,
            }}
          >
            {centerText.percentage}%
          </div>
          <div
            style={{
              ...styles.labelText,
              fontSize: `${containerHeight / 240}rem`,
            }}
          >
            {centerText.label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;

const styles = {
  chartOuterContainer: {
    position: "relative" as const,
    height: "100%", // Full height for the container
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row" as const,
    position: "relative" as const,
    padding: "0px",
    backgroundColor: "#fff",
    height: "91%",
  },
  title: {
    marginBottom: "10px",
    fontSize: "1rem",
    color: "#333",
  },
  legend: {
    display: "flex",
    flexDirection: "column" as const,
    marginRight: "1.25rem",
    marginLeft: "0.3125rem",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
    color: "#333",
    paddingBottom: "0.25rem",
    gap: "0.375rem",
    alignSelf: "stretch",
    borderBottom: "1px solid #707070",
  },
  centerText: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center" as const,
    textTransform: "capitalize" as "capitalize",
  },
  percentageText: {
    fontSize: "1.5rem",
    fontWeight: "bold" as const,
  },
  labelText: {
    textTransform: "capitalize" as "capitalize",
  },
};
