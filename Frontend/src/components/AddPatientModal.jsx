import React, { useState } from "react";
import {
  createPatient,
  uploadCSV,
} from "../api";

const AddPatientModal = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] =
    useState({
      name: "",
      bed_no: "",
      age: "",
    });

  const [csvFile, setCsvFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  /* =========================
     HANDLE TEXT INPUT
  ========================= */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  /* =========================
     HANDLE CSV FILE
  ========================= */

  const handleFileChange = (
    e
  ) => {
    setCsvFile(e.target.files[0]);
  };

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      /* -------------------------
         CASE 1: CSV UPLOAD
      ------------------------- */

      if (csvFile) {
        await uploadCSV(csvFile);

        alert(
          "CSV uploaded successfully"
        );

        onSuccess();
        onClose();

        return;
      }

      /* -------------------------
         CASE 2: MANUAL ENTRY
      ------------------------- */

      if (
        !formData.name ||
        !formData.bed_no ||
        !formData.age
      ) {
        alert(
          "Please fill all fields"
        );
        return;
      }

      await createPatient({
        name: formData.name,
        bed_no: Number(
          formData.bed_no
        ),
        age: Number(
          formData.age
        ),
      });

      alert(
        "Patient added successfully"
      );

      onSuccess();
      onClose();

    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Failed to add patient"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div className="bg-[#0f172a] p-8 rounded-xl w-full max-w-md border border-gray-700">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-semibold text-white">
            Add Patient / Upload CSV
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* NAME */}

          <div>

            <label className="text-gray-400">
              Patient Name
            </label>

            <input
              type="text"
              name="name"
              value={
                formData.name
              }
              onChange={
                handleChange
              }
              placeholder="Enter patient name"
              className="
                w-full
                mt-1
                p-3
                rounded-lg
                bg-[#020817]
                border
                border-gray-600
                focus:outline-none
                focus:border-[#2dd4bf]
              "
            />

          </div>

          {/* BED */}

          <div>

            <label className="text-gray-400">
              Bed Number
            </label>

            <input
              type="number"
              name="bed_no"
              value={
                formData.bed_no
              }
              onChange={
                handleChange
              }
              placeholder="Enter bed number"
              className="
                w-full
                mt-1
                p-3
                rounded-lg
                bg-[#020817]
                border
                border-gray-600
                focus:outline-none
                focus:border-[#2dd4bf]
              "
            />

          </div>

          {/* AGE */}

          <div>

            <label className="text-gray-400">
              Age
            </label>

            <input
              type="number"
              name="age"
              value={
                formData.age
              }
              onChange={
                handleChange
              }
              placeholder="Enter age"
              className="
                w-full
                mt-1
                p-3
                rounded-lg
                bg-[#020817]
                border
                border-gray-600
                focus:outline-none
                focus:border-[#2dd4bf]
              "
            />

          </div>

          {/* CSV UPLOAD */}

          <div>

            <label className="text-gray-400">
              Upload Patient CSV
            </label>

            <input
              type="file"
              accept=".csv"
              onChange={
                handleFileChange
              }
              className="
                w-full
                mt-1
                p-2
                rounded-lg
                bg-[#020817]
                border
                border-gray-600
                text-gray-300
              "
            />

          </div>

          {/* BUTTONS */}

          <div className="flex justify-end gap-3 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="
                px-5
                py-2
                rounded-lg
                border
                border-gray-600
                text-gray-300
                hover:bg-gray-700
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="
                px-6
                py-2
                rounded-lg
                bg-[#2dd4bf]
                text-black
                font-semibold
                hover:bg-[#14b8a6]
                transition
              "
            >
              {loading
                ? "Processing..."
                : "Submit"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AddPatientModal;