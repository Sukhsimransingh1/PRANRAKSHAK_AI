import React, { useEffect, useState } from "react";

import PatientCard from "../components/PatientCard";
import AddPatientModal from "../components/AddPatientModal";
import AlertSection from "../components/AlertSection";

import {
  getPatients,
  deletePatient,
} from "../api";

/* =========================
   DUMMY DATA
========================= */

const dummyPatients = [
  {
    id: 1,
    name: "Rohit sharma",
    bed_no: 12,
    age: 45,
    risk: "HIGH",
  },
  {
    id: 2,
    name: "Anita Singh",
    bed_no: 5,
    age: 32,
    risk: "MEDIUM",
  },
  {
    id: 3,
    name: "Ramesh Kumar",
    bed_no: 8,
    age: 60,
    risk: "LOW",
  },
];

const PatientQueuePage = () => {
  const [patients, setPatients] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [openModal, setOpenModal] =
    useState(false);

  const [isDummy, setIsDummy] =
    useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data =
        await getPatients();

      if (
        !data ||
        data.length === 0
      ) {
        setPatients(
          dummyPatients
        );
        setIsDummy(true);
      } else {
        setPatients(data);
        setIsDummy(false);
      }

      setLoading(false);

    } catch (error) {
      console.error(error);

      setPatients(
        dummyPatients
      );

      setIsDummy(true);

      setLoading(false);
    }
  };

  /* =========================
     DELETE
  ========================= */

  const handleDelete =
    async (id) => {
      try {
        await deletePatient(id);

        fetchPatients();

      } catch (error) {
        alert(
          "Failed to delete patient"
        );
      }
    };

  /* =========================
     PRIORITY SORTING
  ========================= */

  const sortedPatients = [
    ...patients,
  ].sort((a, b) => {
    const priority = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return (
      (priority[b.risk] || 0) -
      (priority[a.risk] || 0)
    );
  });

  return (
    <div className="min-h-screen bg-[#020817] text-white px-8 py-8">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-4xl font-bold">
            Patient Priority Queue
          </h1>

          <p className="text-gray-400 mt-1">
            Patients monitored for sepsis risk
          </p>

          {isDummy && (
            <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm mt-2 inline-block">
              Demo Data Mode
            </span>
          )}

        </div>

        <button
          onClick={() =>
            setOpenModal(true)
          }
          className="
            bg-[#2dd4bf]
            text-black
            px-6
            py-3
            rounded-lg
            font-semibold
            hover:bg-[#14b8a6]
          "
        >
          + Add Patient
        </button>

      </div>

      {/* ALERTS */}

      <AlertSection />

      {/* LOADING */}

      {loading && (
        <p>
          Loading patients...
        </p>
      )}

      {/* PATIENT LIST */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">

        {sortedPatients.map(
          (patient) => (

            <PatientCard
              key={patient.id}
              patient={patient}
              onDelete={
                handleDelete
              }
            />

          )
        )}

      </div>

      {/* MODAL */}

      {openModal && (
        <AddPatientModal
          onClose={() =>
            setOpenModal(false)
          }
          onSuccess={
            fetchPatients
          }
        />
      )}

    </div>
  );
};

export default PatientQueuePage;