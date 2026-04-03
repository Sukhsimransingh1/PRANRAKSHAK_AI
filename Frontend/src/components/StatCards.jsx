// src/components/StatCards.jsx

import React from "react";

const StatCards = ({ patients }) => {
  const total = patients.length;

  const high =
    patients.filter(
      (p) => p.risk === "HIGH"
    ).length;

  const medium =
    patients.filter(
      (p) => p.risk === "MEDIUM"
    ).length;

  const low =
    patients.filter(
      (p) => p.risk === "LOW"
    ).length;

  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">

      <Card
        label="Total Patients"
        value={total}
      />

      <Card
        label="High Risk"
        value={high}
        color="text-red-400"
      />

      <Card
        label="Medium Risk"
        value={medium}
        color="text-yellow-400"
      />

      <Card
        label="Low Risk"
        value={low}
        color="text-green-400"
      />

    </div>
  );
};

const Card = ({
  label,
  value,
  color,
}) => (
  <div className="bg-[#0f172a] p-6 rounded-xl border border-gray-700">

    <p className="text-gray-400">
      {label}
    </p>

    <p
      className={`text-3xl font-bold mt-2 ${color}`}
    >
      {value}
    </p>

  </div>
);

export default StatCards;