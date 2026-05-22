import { Employee } from "@/data/employees";

const STORAGE_KEY = "employees_list";

export function loadEmployees(): Employee[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Employee[];
  } catch {
    return [];
  }
}

export function saveEmployees(employees: Employee[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

export function sheetUrlToCsvUrl(input: string): string {
  // Convert edit URL → export CSV URL
  const match = input.match(
    /spreadsheets\/d\/([a-zA-Z0-9_-]+).*[#&?]gid=(\d+)/
  );
  if (match) {
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${match[2]}`;
  }
  // Already a CSV/export URL or custom URL — use as-is
  return input;
}

export function parseCsvToEmployees(csv: string): Employee[] {
  const lines = csv.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  // Find column indices flexibly
  const idIdx = headers.findIndex((h) =>
    h.includes("employee id") || h.includes("emp id") || h === "id" || h.includes("empid")
  );
  const nameIdx = headers.findIndex((h) =>
    h.includes("full name") || h.includes("name")
  );
  const deptIdx = headers.findIndex((h) =>
    h.includes("department") || h.includes("dept")
  );

  if (idIdx === -1 || nameIdx === -1) return [];

  const employees: Employee[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const id = cols[idIdx]?.trim().replace(/^"|"$/g, "") ?? "";
    const name = cols[nameIdx]?.trim().replace(/^"|"$/g, "") ?? "";
    const department = deptIdx !== -1 ? (cols[deptIdx]?.trim().replace(/^"|"$/g, "") ?? "") : "";
    if (id && name) {
      employees.push({ id, name, department });
    }
  }
  return employees;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
