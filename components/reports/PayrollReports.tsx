'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle2, AlertCircle, Loader2, Plus, Eye } from 'lucide-react';

interface PayrollReportsProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface P10Submission {
  id: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'VALIDATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedAt?: string;
  kraReference?: string;
  createdAt: string;
  updatedAt: string;
}

// Simple Button component
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'default', 
  size = 'default',
  className = ''
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variants: Record<'default' | 'outline', string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  };
  const sizes: Record<'sm' | 'default' | 'lg', string> = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    default: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-md'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function PayrollReports({ onSuccess, onError }: PayrollReportsProps) {
  const [submissions, setSubmissions] = useState<P10Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('list');
  const [actionLoading, setActionLoading] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const statusConfig = {
    DRAFT: { badge: 'bg-yellow-100 text-yellow-700' },
    VALIDATED: { badge: 'bg-blue-100 text-blue-700' },
    SUBMITTED: { badge: 'bg-green-100 text-green-700' },
    APPROVED: { badge: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { badge: 'bg-red-100 text-red-700' },
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll/p10?action=list');
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error) {
      const errorMsg = 'Error fetching submissions';
      console.error(errorMsg, error);
      onError?.(errorMsg);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/payroll/p10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate P10');
      }

      onSuccess?.(`P10 generated for ${months[selectedMonth - 1]} ${selectedYear}. Ready to download.`);
      fetchSubmissions();
      setActiveTab('list');
    } catch (error) {
      const errorMsg = `Error generating P10: ${(error as Error).message}`;
      onError?.(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (month: number, year: number) => {
    try {
      const params = new URLSearchParams({
        action: 'download',
        month: month.toString(),
        year: year.toString(),
      });

      const res = await fetch(`/api/payroll/p10?${params}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await res.blob();
      
      if (!blob.type.includes('spreadsheet') && !blob.type.includes('excel')) {
        console.warn('Unexpected file type:', blob.type);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `P10_${year}-${String(month).padStart(2, '0')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      onSuccess?.(`P10 XLSM downloaded for ${months[month - 1]} ${year}`);
    } catch (error) {
      const errorMsg = `Error downloading file: ${(error as Error).message}`;
      onError?.(errorMsg);
    }
  };

  const handleMarkSubmitted = async (month: number, year: number) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/payroll/p10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markSubmitted',
          month,
          year,
          submissionNotes: `Submitted to KRA iTax portal on ${new Date().toLocaleDateString()}`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to mark as submitted');
      }

      onSuccess?.(`P10 marked as submitted for ${months[month - 1]} ${year}. Save your KRA acknowledgement.`);
      fetchSubmissions();
    } catch (error) {
      const errorMsg = `Error: ${(error as Error).message}`;
      onError?.(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      DRAFT: <FileText className="w-3 h-3" />,
      VALIDATED: <CheckCircle2 className="w-3 h-3" />,
      SUBMITTED: <CheckCircle2 className="w-3 h-3" />,
      APPROVED: <CheckCircle2 className="w-3 h-3" />,
      REJECTED: <AlertCircle className="w-3 h-3" />,
    };
    return icons[status] || <FileText className="w-3 h-3" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-gray-900">P10 Tax Returns</h1>
            <Button
              onClick={() => setActiveTab('generate')}
              size="sm"
              className="gap-1.5 h-7 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New P10
            </Button>
          </div>
        </div>
      </div>

      {/* Minimal Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: 'list', label: 'All Submissions' },
              { id: 'generate', label: 'Generate' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 text-xs font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-md">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Generate P10 XLSM</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full text-sm bg-white border border-gray-300 rounded-md px-2 py-1.5 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {months.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full text-sm bg-white border border-gray-300 rounded-md px-2 py-1.5 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 rounded-md p-2.5 mb-3 border border-blue-100">
              <p className="text-xs text-blue-800 leading-relaxed">
                Excel format with sheets A, B, M, L, N ready for KRA iTax
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={actionLoading}
              size="sm"
              className="w-full gap-1.5 h-8 text-xs"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  Generate P10
                </>
              )}
            </Button>

            <div className="mt-3 p-2.5 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-1.5">Submission Steps:</p>
              <ol className="text-xs text-gray-600 space-y-1 pl-3.5 list-decimal marker:text-gray-400">
                <li>Generate and download XLSM</li>
                <li>Upload to <a href="https://itax.kra.go.ke" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">iTax</a> before 9th</li>
                <li>Generate payment slip and remit</li>
              </ol>
            </div>
          </div>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No submissions yet</p>
                <p className="text-xs text-gray-500">Generate your first P10 to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => {
                  const config = statusConfig[sub.status as keyof typeof statusConfig] || statusConfig.DRAFT;
                  const monthName = months[sub.month - 1];
                  const isDraft = sub.status === 'DRAFT';

                  return (
                    <div
                      key={sub.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-all cursor-default"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-medium text-gray-900 tracking-tight">
                              {monthName} {sub.year}
                            </h3>
                            <span className={`${config.badge} text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1`}>
                              {getStatusIcon(sub.status)}
                              <span className="font-medium">{sub.status}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-gray-500">
                            {sub.submittedAt && (
                              <span className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                            {sub.kraReference && (
                              <span className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                {sub.kraReference}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 ml-3">
                          {isDraft && (
                            <Button
                              onClick={() => handleMarkSubmitted(sub.month, sub.year)}
                              disabled={actionLoading}
                              variant="outline"
                              size="sm"
                              className="gap-1 h-7 text-xs"
                            >
                              <Eye className="w-3 h-3" />
                              Submit
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => handleDownload(sub.month, sub.year)}
                            size="sm"
                            className="gap-1 h-7 text-xs"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}