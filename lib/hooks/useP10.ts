// hooks/useP10.ts
import { useState } from "react";

interface P10Submission {
  id: string;
  status: "DRAFT" | "VALIDATED" | "SUBMITTED" | "APPROVED" | "REJECTED";
  month: number;
  year: number;
  kraReference?: string;
  submittedAt?: string;
  errors?: Record<string, unknown>;
}

interface UseP10Return {
  loading: boolean;
  error: string | null;
  submission: P10Submission | null;
  submissions: P10Submission[];
  generateP10: (month: number, year: number) => Promise<void>;
  validateP10: (month: number, year: number, csvFile: File) => Promise<void>;
  markP10AsSubmitted: (month: number, year: number, notes?: string) => Promise<void>;
  downloadP10CSV: (month: number, year: number) => Promise<void>;
  getP10Status: (month: number, year: number) => Promise<void>;
  listP10Submissions: () => Promise<void>;
}

export function useP10(): UseP10Return {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<P10Submission | null>(null);
  const [submissions, setSubmissions] = useState<P10Submission[]>([]);

  const generateP10 = async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payroll/p10", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", month, year }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate P10");
      }

      const data = await response.json();
      setSubmission(data.submission);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const validateP10 = async (month: number, year: number, csvFile: File) => {
    setLoading(true);
    setError(null);
    try {
      const csvText = await csvFile.text();

      const response = await fetch("/api/payroll/p10", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", month, year, csvData: csvText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Validation failed");
      }

      const data = await response.json();
      setSubmission(data.submission);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submitP10toKRA = async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payroll/p10", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", month, year }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit to KRA");
      }

      const data = await response.json();
      setSubmission(data.submission);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const downloadP10CSV = async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/payroll/p10?action=download&month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error("Failed to download CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `P10_${year}-${String(month).padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getP10Status = async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/payroll/p10?action=status&month=${month}&year=${year}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get status");
      }

      const data = await response.json();
      setSubmission(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const listP10Submissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payroll/p10?action=list");

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    submission,
    submissions,
    generateP10,
    validateP10,
    submitP10toKRA,
    downloadP10CSV,
    getP10Status,
    listP10Submissions,
  };
}

// Example usage in a component:
/*
"use client"
import { useP10 } from "@/hooks/useP10";
import { useState } from "react";

export function P10Form() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { loading, error, generateP10, downloadP10CSV, submitP10toKRA } = useP10();

  return (
    <div>
      <input type="number" value={month} onChange={(e) => setMonth(parseInt(e.target.value))} />
      <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} />
      
      <button onClick={() => generateP10(month, year)} disabled={loading}>
        Generate P10
      </button>
      
      <button onClick={() => downloadP10CSV(month, year)} disabled={loading}>
        Download CSV
      </button>
      
      <button onClick={() => submitP10toKRA(month, year)} disabled={loading}>
        Submit to KRA
      </button>
      
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
*/