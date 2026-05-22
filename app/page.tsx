"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Employee } from "@/data/employees";
import {
  loadAttendance,
  markEmployee,
  DailyAttendance,
} from "@/lib/attendance";
import { loadEmployees } from "@/lib/employees";

export default function AttendancePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<DailyAttendance | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const emps = loadEmployees();
    setEmployees(emps);
    setAttendance(loadAttendance(emps));
  }, []);

  const presentCount = useMemo(() => {
    if (!attendance) return 0;
    return Object.values(attendance.records).filter(
      (r) => r.status === "present"
    ).length;
  }, [attendance]);

  const filteredEmployees = useMemo(() => {
    if (!attendance) return [];
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.id.toLowerCase().includes(search.toLowerCase()) ||
        emp.department.toLowerCase().includes(search.toLowerCase());
      const status = attendance.records[emp.id]?.status ?? "absent";
      const matchesFilter =
        filter === "all" ||
        (filter === "present" && status === "present") ||
        (filter === "absent" && status === "absent");
      return matchesSearch && matchesFilter;
    });
  }, [search, attendance, filter]);

  function handleToggle(employeeId: string) {
    if (!attendance) return;
    const current = attendance.records[employeeId]?.status ?? "absent";
    const next = current === "present" ? "absent" : "present";
    setAttendance(markEmployee(attendance, employeeId, next));
  }


  if (!attendance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-lg">Loading...</div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="px-6 py-5 flex items-center justify-between gap-3">
          {/* Left: logo + title */}
          <div className="flex items-center gap-4">
            <Image
              src="/company-logo.png"
              alt="Company Logo"
              width={100}
              height={100}
              className="object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">BLR Office Attendance</h1>
              <p className="text-blue-200 text-sm mt-0.5">{today}</p>
            </div>
          </div>

          {/* Right: counters + hamburger */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-800 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold">{presentCount}</div>
              <div className="text-xs text-blue-300">Present</div>
            </div>
            <div className="bg-blue-800 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold">{employees.length - presentCount}</div>
              <div className="text-xs text-blue-300">Absent</div>
            </div>

            {/* Hamburger */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-2 rounded-lg hover:bg-blue-600 transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); router.push("/admin"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Search + Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, ID or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "present"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full text-center py-16 text-slate-400 text-sm">
              No employees found matching "{search}"
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const status = attendance.records[emp.id]?.status ?? "absent";
              const markedAt = attendance.records[emp.id]?.markedAt;
              const isPresent = status === "present";
              return (
                <div
                  key={emp.id}
                  className={`bg-white rounded-xl border-2 shadow-sm p-4 flex items-center gap-4 transition-all ${
                    isPresent
                      ? "border-green-400 bg-green-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${
                      isPresent
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.id} · {emp.department}</div>
                    {isPresent && markedAt && (
                      <div className="text-xs text-green-600 mt-0.5">
                        Checked in at {new Date(markedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggle(emp.id)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isPresent
                        ? "bg-green-500 text-white hover:bg-red-500"
                        : "bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700"
                    }`}
                  >
                    {isPresent ? "Present ✓" : "Mark Present"}
                  </button>
                </div>
              );
            })
          )}
        </div>

      </main>

    </div>
  );
}
