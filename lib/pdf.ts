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
  doc.text(`Generated at: ${new Date().toLocaleTimeString("en-IN")}`, 14, 37);
  doc.text(`Total Present: ${present.length} / ${employees.length}`, 14, 44);

  // Table
  autoTable(doc, {
    startY: 52,
    head: [["#", "Employee ID", "Name", "Department", "Checked In At"]],
    body: present.map((emp, i) => {
      const record = attendance.records[emp.id];
      const checkedIn = record?.markedAt
        ? new Date(record.markedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "—";
      return [i + 1, emp.id, emp.name, emp.department, checkedIn];
    }),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [240, 245, 255] },
  });

  const filename = `attendance_${attendance.date}.pdf`;
  doc.save(filename);
}
