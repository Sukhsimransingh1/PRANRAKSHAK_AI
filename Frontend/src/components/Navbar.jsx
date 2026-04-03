import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import CopilotDrawer from "./CopilotDrawer";

const Navbar = () => {
  const location = useLocation();

  const [copilotOpen, setCopilotOpen] =
    useState(false);

  const isActive = (path) => {
    if (path === "/")
      return location.pathname === "/";
    return location.pathname.startsWith(
      path
    );
  };

  const linkClass = (path) =>
    `px-4 py-2 rounded-lg font-medium transition ${
      isActive(path)
        ? "bg-[#2dd4bf] text-black"
        : "text-gray-300 hover:text-white hover:bg-[#0f172a]"
    }`;

  return (
    <>
      {/* Copilot Drawer */}

      <CopilotDrawer
        isOpen={copilotOpen}
        onClose={() =>
          setCopilotOpen(false)
        }
      />

      <nav className="w-full bg-[#020817] border-b border-gray-700 px-8 py-4 flex justify-between items-center">

        {/* Logo */}

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-[#2dd4bf] rounded-lg flex items-center justify-center text-black font-bold">
            PR
          </div>

          <div>
            <h1 className="text-lg font-semibold text-white">
              PranRakshak AI
            </h1>

            <p className="text-xs text-gray-400">
              Sepsis Monitoring System
            </p>
          </div>
        </Link>

        {/* Navigation */}

        <div className="flex items-center gap-4">

          <Link
            to="/"
            className={linkClass("/")}
          >
            Home
          </Link>

          <Link
            to="/queue"
            className={linkClass("/queue")}
          >
            Patient Queue
          </Link>

          <Link
            to="/dashboard"
            className={linkClass(
              "/dashboard"
            )}
          >
            Dashboard
          </Link>

          {/* Copilot Button */}

          <button
            onClick={() =>
              setCopilotOpen(
                !copilotOpen
              )
            }
            className="
              bg-[#2dd4bf]
              text-black
              px-4
              py-2
              rounded-lg
              font-semibold
              hover:bg-[#14b8a6]
            "
          >
            AI Copilot
          </button>

        </div>

        {/* Status */}

        <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">

          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />

          System Active

        </div>

      </nav>
    </>
  );
};

export default Navbar;