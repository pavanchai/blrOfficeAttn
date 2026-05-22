import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Employee } from "@/data/employees";
import { DailyAttendance } from "@/lib/attendance";

export function exportPresentEmployeesPDF(
  employees: Employee[],
  attendance: DailyAttendance
): void {
  const present = employees.filter(
    (e) => attendance.records[e.id]?.status === "present"
  );

  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("BLR Office — Daily Attendance Report", 14, 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Date: ${dateStr}`, 14, 30);
  doc.text(`Total Present: ${present.length} / ${employees.length}`, 14, 37);

  // Table
  autoTable(doc, {
    startY: 45,
    head: [["#", "Employee ID", "Name", "Department"]],
    body: present.map((emp, i) => [i + 1, emp.id, emp.name, emp.department]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [240, 245, 255] },
  });

  const filename = `attendance_${attendance.date}.pdf`;
  doc.save(filename);
}
