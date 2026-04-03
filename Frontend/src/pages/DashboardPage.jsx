import React, { useEffect, useState } from "react";
import { getPatients } from "../api";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const COLORS = [
  "#ef4444",
  "#facc15",
  "#22c55e",
];

/* =========================
   DUMMY DATA
========================= */

const generateDummyData = () => {
  const data = [];

  for (let i = 0; i < 24; i++) {
    data.push({
      Hour: i,
      HR: 70 + Math.random() * 10,
      O2Sat: 97 + Math.random(),
      Temp: 36.5 + Math.random(),
      SBP: 120 + Math.random() * 10,
      MAP: 85 + Math.random() * 5,
      Resp: 16 + Math.random() * 2,
      WBC: 6 + Math.random(),
      Creatinine: 0.9 + Math.random() * 0.2,
      Glucose: 90 + Math.random() * 20,
      Age: 30,
      ICULOS: i,
      SepsisLabel:
        i > 18 ? 1 : 0,
    });
  }

  return data;
};

const Dashboard = () => {
  const [chartData, setChartData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [isDummy, setIsDummy] =
    useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const patients =
        await getPatients();

      if (
        !patients ||
        patients.length === 0
      ) {
        const dummy =
          generateDummyData();

        setChartData(dummy);
        setIsDummy(true);
      } else {
        if (patients[0]?.records) {
          setChartData(
            patients[0].records
          );
        } else {
          setChartData(
            generateDummyData()
          );
          setIsDummy(true);
        }
      }

      setLoading(false);

    } catch (error) {
      console.error(error);

      const dummy =
        generateDummyData();

      setChartData(dummy);
      setIsDummy(true);

      setLoading(false);
    }
  };

  /* =========================
     AVERAGES
  ========================= */

  const average = (key) => {
    return (
      chartData.reduce(
        (sum, item) =>
          sum + item[key],
        0
      ) / chartData.length
    ).toFixed(2);
  };

  const avgData = [
    { name: "HR", value: average("HR") },
    { name: "Temp", value: average("Temp") },
    { name: "O2Sat", value: average("O2Sat") },
    { name: "MAP", value: average("MAP") },
    { name: "Resp", value: average("Resp") },
  ];

  /* =========================
     RISK DISTRIBUTION
  ========================= */

  let critical = 0;
  let medium = 0;
  let low = 0;

  chartData.forEach((p) => {
    if (p.SepsisLabel === 1)
      critical++;
    else if (p.HR > 90)
      medium++;
    else low++;
  });

  const riskData = [
    { name: "Critical", value: critical },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#020817]">
        Loading Dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020817] text-white p-8">

      <div className="flex justify-between mb-8">

        <h1 className="text-4xl font-bold">
          ICU Monitoring Dashboard
        </h1>

        {isDummy && (
          <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
            Demo Data Mode
          </span>
        )}

      </div>

      {/* =========================
         TIME SERIES GRAPH
      ========================= */}

      <div className="bg-[#0f172a] p-6 rounded-xl border border-gray-700 mb-8">

        <h2 className="text-xl font-semibold mb-4">
          Patient Health Time-Series
        </h2>

        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <LineChart data={chartData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="Hour" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="HR"
              stroke="#ef4444"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="Temp"
              stroke="#facc15"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="O2Sat"
              stroke="#22c55e"
              strokeWidth={2}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      {/* =========================
         PIE + BAR
      ========================= */}

      <div className="grid md:grid-cols-2 gap-8 mb-8">

        <div className="bg-[#0f172a] p-6 rounded-xl border border-gray-700">

          <h2 className="text-xl font-semibold mb-4">
            Patient Condition Distribution
          </h2>

          <ResponsiveContainer width="100%" height={300}>

            <PieChart>

              <Pie
                data={riskData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >

                {riskData.map(
                  (entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index]}
                    />
                  )
                )}

              </Pie>

              <Tooltip />
              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>

        <div className="bg-[#0f172a] p-6 rounded-xl border border-gray-700">

          <h2 className="text-xl font-semibold mb-4">
            Average Patient Vitals
          </h2>

          <ResponsiveContainer width="100%" height={300}>

            <BarChart data={avgData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#2dd4bf"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;