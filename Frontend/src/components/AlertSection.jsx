import React, {
  useEffect,
  useState,
} from "react";

import { getAlerts } from "../api";

const AlertSection = () => {
  const [alerts, setAlerts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data =
        await getAlerts();

      setAlerts(data);
      setLoading(false);

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-700 mb-6">
        Loading alerts...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-700 mb-6 text-green-400">
        No active alerts
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl border border-red-500 mb-6">

      <h2 className="text-lg font-semibold text-red-400 mb-3">
        Critical Alerts
      </h2>

      <div className="space-y-3">

        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-[#020817] p-3 rounded-lg border border-red-400 flex justify-between items-center"
          >

            <div>

              <p className="font-medium">
                Patient ID: {alert.patient_id}
              </p>

              <p className="text-sm text-gray-400">
                Risk escalated to HIGH
              </p>

            </div>

            <span className="text-red-400 font-semibold">
              HIGH
            </span>

          </div>
        ))}

      </div>

    </div>
  );
};

export default AlertSection;