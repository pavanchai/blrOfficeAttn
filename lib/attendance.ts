import { Employee } from "@/data/employees";

export type AttendanceStatus = "present" | "absent";

export interface AttendanceRecord {
  employeeId: string;
  status: AttendanceStatus;
  markedAt: string | null;
}

export interface DailyAttendance {
  date: string;
  records: Record<string, AttendanceRecord>;
}

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function loadAttendance(employees: Employee[]): DailyAttendance {
  if (typeof window === "undefined") {
    return buildDefault(employees);
  }
  const todayKey = getTodayKey();
  const stored = localStorage.getItem(`attendance_${todayKey}`);
  if (stored) {
    try {
      return JSON.parse(stored) as DailyAttendance;
    } catch {
      // corrupted data — rebuild
    }
  }
  return buildDefault(employees);
}

function buildDefault(employees: Employee[]): DailyAttendance {
  const records: Record<string, AttendanceRecord> = {};
  for (const emp of employees) {
    records[emp.id] = { employeeId: emp.id, status: "absent", markedAt: null };
  }
  return { date: getTodayKey(), records };
}

export function saveAttendance(data: DailyAttendance): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`attendance_${data.date}`, JSON.stringify(data));
}

export function resetAttendance(employees: Employee[]): DailyAttendance {
  const fresh = buildDefault(employees);
  saveAttendance(fresh);
  return fresh;
}

export function mergeAttendanceAfterImport(
  existing: DailyAttendance,
  newEmployees: Employee[]
): DailyAttendance {
  const records: Record<string, AttendanceRecord> = {};
  for (const emp of newEmployees) {
    // Keep existing attendance if employee was already tracked, otherwise default to absent
    records[emp.id] = existing.records[emp.id] ?? {
      employeeId: emp.id,
      status: "absent",
      markedAt: null,
    };
  }
  const merged = { ...existing, records };
  saveAttendance(merged);
  return merged;
}

export function markEmployee(
  data: DailyAttendance,
  employeeId: string,
  status: AttendanceStatus
): DailyAttendance {
  const updated: DailyAttendance = {
    ...data,
    records: {
      ...data.records,
      [employeeId]: {
        employeeId,
        status,
        markedAt: status === "present" ? new Date().toISOString() : null,
      },
    },
  };
  saveAttendance(updated);
  return updated;
}
