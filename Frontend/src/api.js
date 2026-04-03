const BASE_URL = "http://localhost:8000";

/* =========================
   Helper
========================= */

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage;

    try {
      errorMessage = await response.text();
    } catch {
      errorMessage = "Unknown error";
    }

    console.error("API Error:", errorMessage);

    throw new Error(errorMessage);
  }

  return response.json();
};

/* =========================
   PATIENTS
========================= */

export const getPatients = async () => {
  const response = await fetch(
    `${BASE_URL}/patients`
  );

  return handleResponse(response);
};

export const getPatientById = async (id) => {
  const response = await fetch(
    `${BASE_URL}/patients/${id}`
  );

  return handleResponse(response);
};

/* =========================
   CREATE PATIENT
========================= */

export const createPatient = async (
  patientData
) => {
  const formData = new FormData();

  formData.append(
    "name",
    patientData.name
  );

  formData.append(
    "bed_no",
    Number(patientData.bed_no)
  );

  formData.append(
    "age",
    Number(patientData.age)
  );

  const response = await fetch(
    `${BASE_URL}/patients`,
    {
      method: "POST",
      body: formData,
    }
  );

  return handleResponse(response);
};

/* =========================
   UPDATE PATIENT
========================= */

export const updatePatient = async (
  id,
  patientData
) => {
  const formData = new FormData();

  formData.append(
    "name",
    patientData.name
  );

  formData.append(
    "bed_no",
    Number(patientData.bed_no)
  );

  formData.append(
    "age",
    Number(patientData.age)
  );

  const response = await fetch(
    `${BASE_URL}/patients/${id}`,
    {
      method: "PUT",
      body: formData,
    }
  );

  return handleResponse(response);
};

/* =========================
   DELETE PATIENT
========================= */

export const deletePatient = async (id) => {
  const response = await fetch(
    `${BASE_URL}/patients/${id}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
};

/* =========================
   UPLOAD CSV
========================= */

export const uploadCSV = async (
  file
) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${BASE_URL}/patients`,
    {
      method: "POST",
      body: formData,
    }
  );

  return handleResponse(response);
};

/* =========================
   RUN PREDICTION
========================= */

export const runPrediction = async (
  id
) => {
  const response = await fetch(
    `${BASE_URL}/patients/${id}/predict`,
    {
      method: "POST",
    }
  );

  return handleResponse(response);
};

/* =========================
   ALERTS
========================= */

export const getAlerts = async () => {
  const response = await fetch(
    `${BASE_URL}/alerts`
  );

  return handleResponse(response);
};

/* =========================
   COPILOT
========================= */

export const askCopilot = async (
  question,
  patientId
) => {
  const response = await fetch(
    `${BASE_URL}/copilot`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        question,
        patient_id: patientId,
      }),
    }
  );

  return handleResponse(response);
};