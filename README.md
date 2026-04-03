# 🏥 PranRakshak AI – Early Sepsis Detection System

PranRakshak AI is a machine learning-powered clinical decision support system designed to **detect early signs of sepsis** using ICU patient vitals data.

It helps doctors identify high-risk patients quickly and provides **explainable insights** using SHAP.

---

## 🚀 Features

- 🔍 **Sepsis Risk Prediction**
  - Predicts probability of sepsis from patient vitals
  - Classifies patients into:
    - HIGH risk
    - MEDIUM risk
    - LOW risk

- 📈 **Time-Series Analysis**
  - Uses recent patient vitals (HR, BP, O2, etc.)
  - Captures trends and changes over time

- 🧠 **Explainable AI (SHAP)**
  - Shows *why* a patient is at risk
  - Highlights top contributing factors

- 🤖 **AI Copilot (RAG-based)**
  - Answers clinical questions based on patient data
  - Supports image input (lab reports)

---

## 🛠️ Tech Stack

### 🔹 Machine Learning
- Python
- Pandas, NumPy
- Scikit-learn
- XGBoost
- SHAP

### 🔹 Backend
- FastAPI
- Uvicorn

### 🔹 Frontend
- React (planned / implemented)

---

## 📁 Project Structure
