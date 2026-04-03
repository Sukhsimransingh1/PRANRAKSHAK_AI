// src/components/VitalsChart.jsx

import React from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const VitalsChart = ({
  data,
  metric,
}) => {
  return (
    <div className="bg-[#0f172a] p-6 rounded-xl border border-gray-700">

      <h2 className="mb-4 font-semibold">
        {metric} Trend
      </h2>

      <ResponsiveContainer
        width="100%"
        height={250}
      >

        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="Hour" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey={metric}
            stroke="#2dd4bf"
            strokeWidth={2}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
};

export default VitalsChart;