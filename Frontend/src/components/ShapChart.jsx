// src/components/ShapChart.jsx

import React from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ShapChart = ({ data }) => {
  return (
    <div className="bg-[#0f172a] p-6 rounded-xl border border-gray-700">

      <h2 className="mb-4 font-semibold">
        SHAP Feature Importance
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <BarChart data={data}>

          <XAxis dataKey="feature" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="importance"
            fill="#2dd4bf"
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
};

export default ShapChart;