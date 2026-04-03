import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#020817] text-white">

      {/* HERO SECTION */}

      <section className="px-8 py-24 max-w-6xl mx-auto">

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Intelligent Sepsis Detection
          <br />
          <span className="text-[#2dd4bf]">
            Saves Lives Early
          </span>
        </h1>

        <p className="text-lg text-gray-300 max-w-3xl mb-10 leading-relaxed">
          PranRakshak is an AI-powered hospital monitoring system designed to
          detect early signs of sepsis, prioritize critical patients, and enable
          faster clinical decision-making in emergency and ICU environments.
        </p>

        <Link
          to="/queue"
          className="
            inline-block
            bg-[#2dd4bf]
            text-black
            px-8
            py-4
            rounded-lg
            font-semibold
            hover:bg-[#14b8a6]
            transition
          "
        >
          Get Started
        </Link>

      </section>

      {/* WHAT IS SEPSIS */}

      <section className="px-8 py-20 border-t border-gray-800">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-4xl font-bold mb-6">
            What is Sepsis?
          </h2>

          <p className="text-lg text-gray-300 max-w-4xl leading-relaxed">
            Sepsis is a life-threatening condition caused by the body's extreme
            response to infection. It can rapidly lead to organ failure, septic
            shock, and death if not detected early. Sepsis is one of the leading
            causes of mortality in hospitals worldwide, especially in intensive
            care units.
          </p>

          {/* Statistics */}

          <div className="grid md:grid-cols-3 gap-6 mt-12">

            <div className="bg-[#0f172a] p-6 rounded-xl">

              <h3 className="text-2xl font-bold text-red-400">
                11 Million
              </h3>

              <p className="text-gray-400 mt-2">
                deaths globally each year are caused by sepsis.
              </p>

            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl">

              <h3 className="text-2xl font-bold text-yellow-400">
                Every Hour Matters
              </h3>

              <p className="text-gray-400 mt-2">
                delay in treatment significantly increases mortality risk.
              </p>

            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl">

              <h3 className="text-2xl font-bold text-green-400">
                Early Detection
              </h3>

              <p className="text-gray-400 mt-2">
                timely diagnosis can dramatically improve survival rates.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* PROBLEM SECTION */}

      <section className="px-8 py-20 border-t border-gray-800">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-4xl font-bold mb-6">
            The Challenge in Hospitals
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-10">

            <div className="bg-[#0f172a] p-6 rounded-xl">

              <h3 className="text-xl font-semibold mb-3">
                Late Detection
              </h3>

              <p className="text-gray-400">
                Sepsis symptoms are often subtle and detected too late,
                reducing the chances of successful treatment.
              </p>

            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl">

              <h3 className="text-xl font-semibold mb-3">
                Overloaded Staff
              </h3>

              <p className="text-gray-400">
                Healthcare professionals monitor many patients simultaneously,
                making it difficult to identify high-risk cases quickly.
              </p>

            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl">

              <h3 className="text-xl font-semibold mb-3">
                Manual Prioritization
              </h3>

              <p className="text-gray-400">
                Patients are often treated based on availability rather than
                clinical urgency.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* SOLUTION SECTION */}

      <section className="px-8 py-20 border-t border-gray-800">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-4xl font-bold mb-6">
            How PranRakshak AI Helps
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-10">

            <div className="bg-[#0f172a] p-6 rounded-xl">

              <h3 className="text-xl font-semibold mb-3">
                Real-Time Monitoring
              </h3>

              <p className="text-gray-400">
                Continuously analyzes patient vitals and lab data to detect
                abnormal patterns early.
              </p>

            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl">

              <h3 className="text-xl font-semibold mb-3">
                AI Risk Prediction
              </h3>

              <p className="text-gray-400">
                Machine learning models estimate the probability of sepsis
                development.
              </p>

            </div>

            <div className="bg-[#0f172a] p-6 rounded-xl">

              <h3 className="text-xl font-semibold mb-3">
                Smart Patient Prioritization
              </h3>

              <p className="text-gray-400">
                Automatically ranks patients by urgency so critical cases
                receive immediate medical attention.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* FINAL CTA */}

      <section className="px-8 py-24 text-center border-t border-gray-800">

        <h2 className="text-4xl font-bold mb-6">
          Start Monitoring Patients Smarter
        </h2>

        <p className="text-lg text-gray-400 mb-10">
          Enable intelligent patient prioritization and early sepsis detection
          across your hospital.
        </p>

        <Link
          to="/queue"
          className="
            inline-block
            bg-[#2dd4bf]
            text-black
            px-10
            py-5
            rounded-lg
            font-semibold
            hover:bg-[#14b8a6]
            transition
          "
        >
          Go to Patient Queue
        </Link>

      </section>

    </div>
  );
};

export default HomePage;