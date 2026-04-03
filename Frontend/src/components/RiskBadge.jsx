// src/components/RiskBadge.jsx

import React from "react";

const RiskBadge = ({ risk }) => {
  const getStyle = () => {
    if (risk === "HIGH")
      return "bg-red-500 text-white";

    if (risk === "MEDIUM")
      return "bg-yellow-500 text-black";

    if (risk === "LOW")
      return "bg-green-500 text-white";

    return "bg-gray-500 text-white";
  };

  return (
    <span
      className={`
        px-3
        py-1
        rounded-full
        text-sm
        font-semibold
        ${getStyle()}
      `}
    >
      {risk || "UNKNOWN"}
    </span>
  );
};

export default RiskBadge;