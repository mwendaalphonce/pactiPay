"use client";

import { useState } from "react";
import { useP10 } from "@/lib/hooks/useP10";

export function P10ReportDownload() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { loading, error, downloadP10CSV, generateP10 } = useP10();

  const handleDownloadReports = async () => {
    try {
      // First generate the P10 to ensure data is ready
      await generateP10(month, year);
      
      // Then download the CSV
      setTimeout(() => {
        downloadP10CSV(month, year);
      }, 500);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYear(parseInt(e.target.value));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Download P10 Report</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Month</label>
            <select
              value={month}
              onChange={handleMonthChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString("en-US", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Year</label>
            <input
              type="number"
              value={year}
              onChange={handleYearChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <button
          onClick={handleDownloadReports}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? "Preparing Download..." : "Download P10 CSV"}
        </button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// Or simpler version if you just want quick download:
export function QuickP10Download() {
  const { downloadP10CSV, loading } = useP10();
  const today = new Date();

  const handleQuickDownload = () => {
    downloadP10CSV(today.getMonth() + 1, today.getFullYear());
  };

  return (
    <button
      onClick={handleQuickDownload}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
    >
      {loading ? "Downloading..." : "Download This Month's P10"}
    </button>
  );
}