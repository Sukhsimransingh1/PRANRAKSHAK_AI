import React from "react";
import { useNavigate } from "react-router-dom";

const PatientCard = ({ patient }) => {
  const navigate = useNavigate();

  const getRiskColor = (risk) => {
    if (risk === "HIGH") return "bg-red-500";
    if (risk === "MEDIUM") return "bg-yellow-500";
    if (risk === "LOW") return "bg-green-500";
    return "bg-gray-500";
  };

  return (
    <div
      onClick={() => navigate("/dashboard")}
      className="
        bg-[#0f172a]
        p-6
        rounded-xl
        cursor-pointer
        border
        border-gray-700
        hover:border-[#2dd4bf]
        hover:scale-[1.02]
        transition
        shadow-lg
      "
    >

      {/* Header */}

      <div className="flex justify-between items-center mb-4">

        <h2 className="text-xl font-semibold">
          {patient.name}
        </h2>

        <span
          className={`
            px-3
            py-1
            rounded-full
            text-sm
            font-semibold
            text-white
            ${getRiskColor(patient.risk)}
          `}
        >
          {patient.risk || "UNKNOWN"}
        </span>

      </div>

      {/* Details */}

      <div className="space-y-2 text-gray-300">

        <p>
          <span className="text-gray-400">
            Bed No:
          </span>{" "}
          {patient.bed_no}
        </p>

        <p>
          <span className="text-gray-400">
            Age:
          </span>{" "}
          {patient.age}
        </p>

        <p>
          <span className="text-gray-400">
            Patient ID:
          </span>{" "}
          {patient.id}
        </p>

      </div>

      {/* Footer */}

      <div className="mt-4 text-sm text-[#2dd4bf] font-medium">
        View Details →
      </div>

    </div>
  );
};

export default PatientCard;