import { jsPDF } from "jspdf";
import { format } from "date-fns";

export interface PayrollData {
  payYear: number;
  payPeriod: number;
  weekStarting: string;
  weekEnding: string;
  billingRate: number;
  timecards: any[];
}

export const generatePayrollPDF = (data: PayrollData) => {
  const doc = new jsPDF();
  const { payYear, payPeriod, weekStarting, weekEnding, timecards } = data;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text("FIRM PAYROLL REPORT", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Pay Period ${payPeriod} of ${payYear}`, 105, 28, { align: "center" });
  doc.text(`${format(new Date(weekStarting), "MMM dd, yyyy")} - ${format(new Date(weekEnding), "MMM dd, yyyy")}`, 105, 33, { align: "center" });

  let yPos = 45;

  // Firm-Wide Stats Header
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("FIRM SUMMARY", 20, yPos);
  yPos += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  // Calculate Aggregated Data per User
  const userMap = new Map();
  timecards.forEach((tc) => {
    const userId = tc.userId;
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        user: tc.user,
        billableHours: Number(tc.billableHours || 0),
        nonBillableHours: Number(tc.nonBillableHours || 0),
        totalHours: Number(tc.totalHours || 0),
        totalCost: Number(tc.totalCost || 0),
        billableEntries: [...(tc.billableEntries || [])]
      });
    } else {
      const existing = userMap.get(userId);
      existing.billableHours += Number(tc.billableHours || 0);
      existing.nonBillableHours += Number(tc.nonBillableHours || 0);
      existing.totalHours += Number(tc.totalHours || 0);
      existing.totalCost += Number(tc.totalCost || 0);
      existing.billableEntries.push(...(tc.billableEntries || []));
    }
  });

  const aggregatedTimecards = Array.from(userMap.values());

  // Calculate Firm Stats
  let totalGross = 0;
  let totalTaxes = 0;
  let totalNet = 0;
  let totalBillable = 0;
  let totalNonBillable = 0;

  aggregatedTimecards.forEach((data) => {
    const hourlyRate = Number(data.user?.employeeProfile?.hourlyRate || 0);
    const gross = data.totalHours * hourlyRate;
    
    // Tax estimation logic
    const taxRecords = data.user?.employeeProfile?.taxes || [];
    let totalTaxPct = taxRecords.reduce((sum: number, t: any) => sum + Number(t.percentage || 0), 0);
    if (totalTaxPct === 0) totalTaxPct = Number(data.user?.employeeProfile?.taxPercentage || 0);
    
    const taxAmount = gross * (totalTaxPct / 100);
    const net = gross - taxAmount;

    totalGross += gross;
    totalTaxes += taxAmount;
    totalNet += net;
    totalBillable += data.billableHours;
    totalNonBillable += data.nonBillableHours;
  });

  const utilizationRate = (totalBillable + totalNonBillable) > 0 
    ? (totalBillable / (totalBillable + totalNonBillable)) * 100 
    : 0;

  // Stats Grid
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("TOTAL GROSS PAYROLL", 20, yPos);
  doc.text("TOTAL ESTIMATED NET", 70, yPos);
  doc.text("TOTAL BILLABLE HOURS", 120, yPos);
  doc.text("FIRM UTILIZATION", 160, yPos);
  
  yPos += 6;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`$${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 20, yPos);
  doc.text(`$${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 70, yPos);
  doc.text(`${totalBillable.toFixed(1)} hrs`, 120, yPos);
  doc.text(`${utilizationRate.toFixed(1)}%`, 160, yPos);

  yPos += 20;

  // Employee Breakdowns
  doc.setFontSize(14);
  doc.text("EMPLOYEE BREAKDOWNS", 20, yPos);
  yPos += 8;
  doc.line(20, yPos, 190, yPos);
  yPos += 12;

  aggregatedTimecards.forEach((data) => {
    // Check for page break
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    const employee = data.user;
    const profile = employee?.employeeProfile;
    const hourlyRate = Number(profile?.hourlyRate || 0);
    const gross = data.totalHours * hourlyRate;
    
    // Segmented Tax Estimation
    const taxRecords = profile?.taxes || [];
    let federalTax = 0;
    let stateTax = 0;

    taxRecords.forEach((t: any) => {
      const pct = Number(t.percentage || 0) / 100;
      const type = (t.taxType || "").toUpperCase();
      if (["FITWH", "MED", "SOC"].includes(type)) {
        federalTax += gross * pct;
      } else {
        stateTax += gross * pct;
      }
    });

    // Fallback if no specific records exist
    if (taxRecords.length === 0) {
      federalTax = gross * 0.15; // 15% estimated federal fallback
      stateTax = gross * 0.05;   // 5% estimated state fallback
    }

    const totalTax = federalTax + stateTax;
    const netPay = gross - totalTax;

    const projectHours = data.billableHours;
    const nonBillableHours = data.nonBillableHours;
    const grandTotalHours = data.totalHours;

    // 1. Employee Identification
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${employee?.name || "Unknown"}`, 20, yPos);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`ID: ${profile?.employeeId || "N/A"}  |  State: ${profile?.state || "N/A"}`, 20, yPos + 5);
    yPos += 12;

    // 2. Hours Summary Section
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("HOURS SUMMARY", 20, yPos);
    yPos += 6;
    doc.setFontSize(8);
    doc.text(`Total Project Hours: ${grandTotalHours.toFixed(2)}`, 25, yPos);
    doc.text(`Total Non Billable Hours: ${nonBillableHours.toFixed(2)}`, 85, yPos);
    doc.text(`Total hours worked: ${projectHours.toFixed(2)}`, 145, yPos);
    yPos += 10;

    // 3. Project Breakdown Table
    doc.setFontSize(9);
    doc.text("PROJECT BREAKDOWN", 20, yPos);
    yPos += 5;
    doc.setDrawColor(230, 230, 230);
    doc.line(20, yPos, 190, yPos);
    yPos += 5;
    
    doc.setFontSize(8);
    const billableEntries = data.billableEntries || [];
    billableEntries.forEach((be: any) => {
      doc.text(`${be.projectName}`, 25, yPos);
      doc.text(`${be.phaseName}`, 85, yPos);
      doc.text(`${Number(be.totalHours).toFixed(2)} hrs`, 185, yPos, { align: "right" });
      yPos += 5;

      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    if (nonBillableHours > 0) {
      doc.text("Non-Billable / Firm Overhead", 25, yPos);
      doc.text("-", 85, yPos);
      doc.text(`${nonBillableHours.toFixed(2)} hrs`, 185, yPos, { align: "right" });
      yPos += 6;
    }

    // 4. Pay & Tax Section
    yPos += 4;
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yPos, 170, 30, "F");
    yPos += 8;
    
    doc.setFontSize(9);
    doc.text(`Hourly Rate: $${hourlyRate.toFixed(2)}`, 30, yPos);
    doc.text(`Gross Pay: $${gross.toFixed(2)}`, 30, yPos + 6);
    doc.text(`Net Est. Pay: $${netPay.toFixed(2)}`, 30, yPos + 12);

    doc.text(`Federal Tax (Est): $${federalTax.toFixed(2)}`, 110, yPos);
    doc.text(`State Tax (Est): $${stateTax.toFixed(2)}`, 110, yPos + 6);
    doc.text(`Total Tax (Est): $${totalTax.toFixed(2)}`, 110, yPos + 12);

    yPos += 25;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${format(new Date(), "PPpp")} | Page ${i} of ${pageCount}`, 105, 285, { align: "center" });
  }

  doc.save(`Payroll_Report_${payYear}_P${payPeriod}.pdf`);
};
