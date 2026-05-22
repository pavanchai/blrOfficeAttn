"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Employee } from "@/data/employees";
import {
  loadAttendance,
  resetAttendance,
  mergeAttendanceAfterImport,
  DailyAttendance,
  getTodayKey,
} from "@/lib/attendance";
import { exportPresentEmployeesPDF } from "@/lib/pdf";
import {
  loadEmployees,
  saveEmployees,
  sheetUrlToCsvUrl,
  parseCsvToEmployees,
} from "@/lib/employees";

const ADMIN_PASSWORD = "Admin@123";

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<DailyAttendance | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Sheet import state
  const [sheetUrl, setSheetUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<Employee[] | null>(null);
  const [importError, setImportError] = useState("");
  const [importDone, setImportDone] = useState(false);

  useEffect(() => {
    const emps = loadEmployees();
    setEmployees(emps);
    setAttendance(loadAttendance(emps));
  }, []);

  function handleExportPDF() {
    if (!attendance) return;
    exportPresentEmployeesPDF(employees, attendance);
  }

  function handleReset() {
    const fresh = resetAttendance(employees);
    setAttendance(fresh);
    setShowResetConfirm(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  }

  async function handleFetchSheet() {
    setImportError("");
    setImportPreview(null);
    setImportDone(false);
    if (!sheetUrl.trim()) {
      setImportError("Please enter a Google Sheet URL.");
      return;
    }
    setImporting(true);
    try {
      const csvUrl = sheetUrlToCsvUrl(sheetUrl.trim());
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`Failed to fetch (${res.status}). Make sure the sheet is set to "Anyone with the link can view".`);
      const text = await res.text();
      if (text.trim().startsWith("<!")) throw new Error("Sheet is not publicly accessible. Set sharing to \"Anyone with the link can view\" and try again.");
      const parsed = parseCsvToEmployees(text);
      if (parsed.length === 0) throw new Error("No valid employee rows found. Check that the sheet has columns: Employee ID, Full Name, Department.");
      setImportPreview(parsed);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setImporting(false);
    }
  }

  function handleConfirmImport() {
    if (!importPreview || !attendance) return;
    saveEmployees(importPreview);
    const merged = mergeAttendanceAfterImport(attendance, importPreview);
    setEmployees(importPreview);
    setAttendance(merged);
    setImportPreview(null);
    setSheetUrl("");
    setImportDone(true);
    setTimeout(() => setImportDone(false), 4000);
  }

  const presentCount = attendance
    ? Object.values(attendance.records).filter((r) => r.status === "present").length
    : 0;

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthed(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Please try again.");
      setPasswordInput("");
    }
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Admin Access</h1>
            <p className="text-sm text-slate-500 mt-1">Enter the admin password to continue</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
                placeholder="Enter password"
                autoFocus
                className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {passwordError}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Back to Attendance
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="px-6 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Image
              src="/company-logo.png"
              alt="Company Logo"
              width={100}
              height={100}
              className="object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-blue-200 text-sm mt-0.5">{today}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 flex items-center gap-6">
          <div className="flex gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-center">
              <div className="text-3xl font-bold text-green-600">{presentCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Present</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-center">
              <div className="text-3xl font-bold text-red-500">{employees.length - presentCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Absent</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{employees.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Total</div>
            </div>
          </div>
          <div className="text-sm text-slate-500 ml-2">
            Today's attendance summary for <span className="font-medium text-slate-700">{getTodayKey()}</span>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Export PDF */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-800">Export Attendance Report</h2>
            </div>
            <p className="text-sm text-slate-500">
              Download a PDF report of all <span className="font-medium text-green-600">{presentCount} present</span> employees for today, including their check-in times.
            </p>
            <button
              onClick={handleExportPDF}
              disabled={presentCount === 0}
              className="mt-auto w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Export Present Employees to PDF
            </button>
          </div>

          {/* Import from Google Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-800">Import from Google Sheet</h2>
            </div>
            <p className="text-sm text-slate-500">
              Paste the Bangalore sheet URL. The sheet must be set to <span className="font-medium text-slate-700">"Anyone with the link can view"</span>.
            </p>
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => { setSheetUrl(e.target.value); setImportError(""); setImportPreview(null); }}
              placeholder="Paste Google Sheet URL..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {importError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {importError}
              </div>
            )}
            {importDone && (
              <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {employees.length} employees imported successfully.
              </div>
            )}
            {importPreview && (() => {
              const existingIds = new Set(employees.map((e) => e.id));
              const incomingIds = new Set(importPreview.map((e) => e.id));
              const added = importPreview.filter((e) => !existingIds.has(e.id));
              const removed = employees.filter((e) => !incomingIds.has(e.id));
              return (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-50 px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 flex gap-3">
                  <span>{importPreview.length} total</span>
                  {added.length > 0 && <span className="text-green-600">+{added.length} new</span>}
                  {removed.length > 0 && <span className="text-red-500">−{removed.length} removed</span>}
                  {added.length === 0 && removed.length === 0 && <span className="text-slate-400">no changes</span>}
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {importPreview.slice(0, 5).map((e) => (
                    <div key={e.id} className={`px-3 py-1.5 flex gap-3 ${!existingIds.has(e.id) ? "bg-green-50 text-green-700" : "text-slate-700"}`}>
                      <span className="text-slate-400 w-16 shrink-0">{e.id}</span>
                      <span className="flex-1 truncate">{e.name}</span>
                      <span className="text-slate-400 truncate">{e.department}</span>
                      {!existingIds.has(e.id) && <span className="text-green-500 font-bold">NEW</span>}
                    </div>
                  ))}
                  {removed.slice(0, 3).map((e) => (
                    <div key={e.id} className="px-3 py-1.5 flex gap-3 bg-red-50 text-red-400 line-through">
                      <span className="w-16 shrink-0">{e.id}</span>
                      <span className="flex-1 truncate">{e.name}</span>
                    </div>
                  ))}
                  {importPreview.length > 5 && (
                    <div className="px-3 py-1.5 text-slate-400">
                      +{importPreview.length - 5} more...
                    </div>
                  )}
                </div>
                <div className="flex gap-2 p-2 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={handleConfirmImport}
                    className="flex-1 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                  >
                    Confirm Import
                  </button>
                  <button
                    onClick={() => setImportPreview(null)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              );
            })()}
            <button
              onClick={handleFetchSheet}
              disabled={importing}
              className="mt-auto w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {importing ? "Fetching..." : "Fetch Employee Data"}
            </button>
          </div>

          {/* Reset */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-800">Reset Attendance</h2>
            </div>
            <p className="text-sm text-slate-500">
              Mark all employees as absent and start fresh for today. Use this every morning before the workday begins.
            </p>
            {resetDone && (
              <div className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                Attendance has been reset successfully.
              </div>
            )}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="mt-auto w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Reset Today's Attendance
            </button>
          </div>
        </div>
      </main>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Reset Today's Attendance?</h2>
            <p className="text-sm text-slate-500 mb-6">
              This will mark all employees as absent for <span className="font-medium">{getTodayKey()}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
