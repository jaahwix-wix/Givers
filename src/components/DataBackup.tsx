import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  FileJson,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Printer,
  Table,
  Layers,
  GraduationCap,
  CreditCard,
  Building2,
  Trash2,
  Radio,
  CheckCircle2,
  Search,
  Eye,
  X,
  ShieldAlert,
  Archive,
  Filter,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, StudentAcademicRecord, NationalExamPrep, StudentFeeLedger } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { wipeAllSystemData, getDatabaseAuditCounts } from '../utils/dataStore';
import { 
  getAllReferenceEntries, 
  exportReferenceEntriesCSV, 
  exportReferenceEntriesJSON, 
  DataEntryReference, 
  ReferenceCategory,
  recordDataEntry
} from '../utils/referenceLog';

interface DataBackupProps {
  students: Student[];
  records: StudentAcademicRecord[];
  examPreps: NationalExamPrep[];
  fees: StudentFeeLedger[];
  onRestoreData: (data: {
    students: Student[];
    records: StudentAcademicRecord[];
    examPreps: NationalExamPrep[];
    fees: StudentFeeLedger[];
  }) => void;
  onResetData: () => void;
  onLoadDemoData?: () => void;
}

export default function DataBackup({ students, records, examPreps, fees, onRestoreData, onResetData, onLoadDemoData }: DataBackupProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals for actions
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');

  // Reference Archive states
  const [referenceEntries, setReferenceEntries] = useState<DataEntryReference[]>(() => getAllReferenceEntries());
  const [refSearch, setRefSearch] = useState('');
  const [refCategory, setRefCategory] = useState<string>('All');
  const [selectedEntryDetail, setSelectedEntryDetail] = useState<DataEntryReference | null>(null);

  const filteredReferences = useMemo(() => {
    return referenceEntries.filter(entry => {
      const matchesSearch = 
        (entry.referenceNumber || '').toLowerCase().includes(refSearch.toLowerCase()) ||
        (entry.title || '').toLowerCase().includes(refSearch.toLowerCase()) ||
        (entry.summary || '').toLowerCase().includes(refSearch.toLowerCase()) ||
        (entry.performedBy || '').toLowerCase().includes(refSearch.toLowerCase());
      const matchesCat = refCategory === 'All' || entry.category === refCategory;
      return matchesSearch && matchesCat;
    });
  }, [referenceEntries, refSearch, refCategory]);

  // Sync reference logs on mount & custom events
  useEffect(() => {
    const handleRefLogged = () => {
      setReferenceEntries(getAllReferenceEntries());
    };
    window.addEventListener('sma_reference_logged', handleRefLogged);
    window.addEventListener('sma_database_wiped', handleRefLogged);
    return () => {
      window.removeEventListener('sma_reference_logged', handleRefLogged);
      window.removeEventListener('sma_database_wiped', handleRefLogged);
    };
  }, []);

  // 1. Export Data to JSON
  const handleExport = () => {
    try {
      const dataToExport = {
        app: 'Givers World Mission School Records Manager',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        payload: {
          students,
          records,
          examPreps,
          fees
        }
      };

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Givers_World_Mission_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('School database backup downloaded successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage('Failed to generate database backup file.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Helper: RFC 4180 compliant CSV generator with UTF-8 BOM
  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    try {
      const csvContent = '\uFEFF' + rows.map(row => 
        row.map(field => {
          const str = String(field ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ).join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage(`Exported ${filename} successfully.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (e) {
      setErrorMessage('Failed to generate CSV export file.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // BULK EXPORT 1: Student Records (CSV)
  const handleExportStudentsCSV = () => {
    if (students.length === 0) {
      setErrorMessage('No student records currently in system to export. System is in live clean slate mode.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    const headers = [
      'Admission Number',
      'Full Name',
      'Gender',
      'Current Class',
      'Stream',
      'Section',
      'Date of Birth',
      'Address',
      'Parent / Guardian Name',
      'Parent Phone',
      'Blood Group',
      'Allergies',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Enrollment Year',
      'Status'
    ];

    const dataRows = students.map(s => [
      s.admissionNumber,
      s.name,
      s.gender,
      s.currentClass,
      s.stream || 'N/A',
      s.classSection || 'A',
      s.dateOfBirth,
      s.address,
      s.parentName,
      s.parentPhone,
      s.bloodType || 'N/A',
      s.allergies || 'None',
      s.emergencyContactName || 'N/A',
      s.emergencyContactPhone || 'N/A',
      s.enrollmentYear,
      s.status
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(`Givers_World_Mission_Students_Register_${dateStr}.csv`, [headers, ...dataRows]);
  };

  // BULK EXPORT 2: Financial Ledgers (CSV)
  const handleExportFeesCSV = () => {
    if (students.length === 0) {
      setErrorMessage('No student fee accounts in system to export. System is in live clean slate mode.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    const headers = [
      'Admission Number',
      'Student Name',
      'Class',
      'Term 1 Billed (SLE)',
      'Term 1 Paid (SLE)',
      'Term 1 Balance (SLE)',
      'Term 2 Billed (SLE)',
      'Term 2 Paid (SLE)',
      'Term 2 Balance (SLE)',
      'Term 3 Billed (SLE)',
      'Term 3 Paid (SLE)',
      'Term 3 Balance (SLE)',
      'Total Annual Billed (SLE)',
      'Total Annual Paid (SLE)',
      'Total Outstanding (SLE)',
      'Account Status'
    ];

    const dataRows = students.map(s => {
      const ledger = fees.find(f => f.studentId === s.id);
      const t1 = ledger?.terms[1] || { totalDue: 0, paidAmount: 0, balance: 0, status: 'Unpaid' };
      const t2 = ledger?.terms[2] || { totalDue: 0, paidAmount: 0, balance: 0, status: 'Unpaid' };
      const t3 = ledger?.terms[3] || { totalDue: 0, paidAmount: 0, balance: 0, status: 'Unpaid' };

      const totalBilled = t1.totalDue + t2.totalDue + t3.totalDue;
      const totalPaid = t1.paidAmount + t2.paidAmount + t3.paidAmount;
      const totalBalance = t1.balance + t2.balance + t3.balance;
      const overallStatus = totalBalance === 0 ? 'Fully Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';

      return [
        s.admissionNumber,
        s.name,
        s.currentClass,
        t1.totalDue,
        t1.paidAmount,
        t1.balance,
        t2.totalDue,
        t2.paidAmount,
        t2.balance,
        t3.totalDue,
        t3.paidAmount,
        t3.balance,
        totalBilled,
        totalPaid,
        totalBalance,
        overallStatus
      ];
    });

    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(`Givers_World_Mission_Financial_Ledger_${dateStr}.csv`, [headers, ...dataRows]);
  };

  // BULK EXPORT 3: Student Master Register (PDF / Printable Report)
  const handleExportStudentsPDF = () => {
    if (students.length === 0) {
      setErrorMessage('No students enrolled in registry. Add students before generating official PDF register.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setErrorMessage('Pop-up window was blocked. Please permit pop-ups for this domain to preview and print.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      const activeCount = students.filter(s => s.status === 'Active').length;
      const maleCount = students.filter(s => s.gender === 'Male').length;
      const femaleCount = students.filter(s => s.gender === 'Female').length;
      const dateString = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const tableRowsHtml = students.map((s, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 600;">${s.admissionNumber}</td>
          <td style="font-weight: 600;">${s.name}</td>
          <td>${s.gender}</td>
          <td><strong>${s.currentClass}</strong> ${s.stream ? `(${s.stream})` : ''}</td>
          <td>${s.parentName}</td>
          <td style="font-family: monospace;">${s.parentPhone}</td>
          <td>${s.address}</td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; ${s.status === 'Active' ? 'background: #ecfdf5; color: #047857;' : 'background: #fef2f2; color: #b91c1c;'}">
              ${s.status}
            </span>
          </td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${SCHOOL_INFO.name} - Student Master Registry</title>
          <style>
            @page { size: landscape; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 16px; font-size: 11px; }
            .header-box { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
            .header-left { display: flex; align-items: center; gap: 14px; }
            .school-logo { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; }
            .school-title { font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin: 0; }
            .school-sub { font-size: 10px; color: #475569; margin: 2px 0 0 0; }
            .report-badge { text-align: right; }
            .badge-title { font-size: 13px; font-weight: 800; color: #4338ca; text-transform: uppercase; margin: 0; }
            .stats-bar { display: flex; gap: 12px; margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; }
            .stat-item { flex: 1; }
            .stat-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
            .stat-value { font-size: 14px; font-weight: 800; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
            th { background-color: #0f172a; color: #ffffff; text-align: left; padding: 6px 8px; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
            td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer-sign { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 16px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid; }
            .sign-col { width: 220px; text-align: center; }
            .sign-line { border-bottom: 1px solid #0f172a; height: 35px; margin-bottom: 4px; }
            .sign-name { font-weight: 800; font-size: 10px; }
            .sign-title { color: #64748b; font-size: 9px; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #3730a3; font-weight: 600;">Official Student Master Register ready for print / save as PDF.</span>
            <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; cursor: pointer;">Print / Save as PDF</button>
          </div>

          <div class="header-box">
            <div class="header-left">
              <img src="${SCHOOL_INFO.logo}" class="school-logo" alt="Logo" />
              <div>
                <h1 class="school-title">${SCHOOL_INFO.name}</h1>
                <p class="school-sub">Motto: <em>"${SCHOOL_INFO.motto}"</em> • ${SCHOOL_INFO.address}</p>
                <p class="school-sub">Ministry of Basic & Senior Secondary Education (MBSSE) • Kambia District Registry</p>
              </div>
            </div>
            <div class="report-badge">
              <p class="badge-title">Official Student Register</p>
              <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Generated: ${dateString}</p>
              <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Academic Year: 2025/2026</p>
            </div>
          </div>

          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-label">Total Enrollment</div>
              <div class="stat-value">${students.length} Students</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Active Status</div>
              <div class="stat-value" style="color: #047857;">${activeCount} Active</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Gender Breakdown</div>
              <div class="stat-value">${maleCount} Male / ${femaleCount} Female</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Accreditation Tier</div>
              <div class="stat-value">Pre-School to SSS 3</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th>Admission No</th>
                <th>Student Full Name</th>
                <th>Gender</th>
                <th>Current Class</th>
                <th>Parent / Guardian</th>
                <th>Contact Phone</th>
                <th>Residential Address</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div class="footer-sign">
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-name">School Registrar</div>
              <div class="sign-title">Givers World Mission Admissions Office</div>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-name">${SCHOOL_INFO.principalName}</div>
              <div class="sign-title">${SCHOOL_INFO.principalTitle}</div>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-name">District Inspector of Schools</div>
              <div class="sign-title">MBSSE Kambia District Directorate</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      setSuccessMessage('Student Registry PDF document opened for printing / save.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage('Failed to generate printable PDF view.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // BULK EXPORT 4: Financial Ledger (PDF / Printable Report)
  const handleExportFeesPDF = () => {
    if (students.length === 0) {
      setErrorMessage('No student fee accounts found. Add students before generating official PDF ledger.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setErrorMessage('Pop-up window was blocked. Please permit pop-ups for this domain to generate the official financial report.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      let totalAnnualBilled = 0;
      let totalAnnualPaid = 0;
      let totalAnnualBalance = 0;

      const rowsHtml = students.map((s, idx) => {
        const ledger = fees.find(f => f.studentId === s.id);
        const t1 = ledger?.terms[1] || { totalDue: 0, paidAmount: 0, balance: 0, status: 'Unpaid' };
        const t2 = ledger?.terms[2] || { totalDue: 0, paidAmount: 0, balance: 0, status: 'Unpaid' };
        const t3 = ledger?.terms[3] || { totalDue: 0, paidAmount: 0, balance: 0, status: 'Unpaid' };

        const billed = t1.totalDue + t2.totalDue + t3.totalDue;
        const paid = t1.paidAmount + t2.paidAmount + t3.paidAmount;
        const balance = t1.balance + t2.balance + t3.balance;

        totalAnnualBilled += billed;
        totalAnnualPaid += paid;
        totalAnnualBalance += balance;

        const statusStyle = balance === 0 
          ? 'background: #ecfdf5; color: #047857;' 
          : paid > 0 
            ? 'background: #fffbeb; color: #b45309;' 
            : 'background: #fef2f2; color: #b91c1c;';

        const statusLabel = balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

        return `
          <tr>
            <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
            <td style="font-family: monospace;">${s.admissionNumber}</td>
            <td style="font-weight: 600;">${s.name}</td>
            <td><strong>${s.currentClass}</strong></td>
            <td style="text-align: right;">SLE ${t1.balance.toLocaleString()}</td>
            <td style="text-align: right;">SLE ${t2.balance.toLocaleString()}</td>
            <td style="text-align: right;">SLE ${t3.balance.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 600;">SLE ${billed.toLocaleString()}</td>
            <td style="text-align: right; color: #047857; font-weight: 700;">SLE ${paid.toLocaleString()}</td>
            <td style="text-align: right; color: ${balance > 0 ? '#b91c1c' : '#047857'}; font-weight: 800;">SLE ${balance.toLocaleString()}</td>
            <td style="text-align: center;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; ${statusStyle}">
                ${statusLabel}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      const collectionRate = totalAnnualBilled > 0 ? Math.round((totalAnnualPaid / totalAnnualBilled) * 100) : 0;
      const dateString = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${SCHOOL_INFO.name} - Official Tuition Accounts Ledger</title>
          <style>
            @page { size: landscape; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 16px; font-size: 11px; }
            .header-box { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
            .header-left { display: flex; align-items: center; gap: 14px; }
            .school-logo { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; }
            .school-title { font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; }
            .school-sub { font-size: 10px; color: #475569; margin: 2px 0 0 0; }
            .stats-bar { display: flex; gap: 12px; margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; }
            .stat-item { flex: 1; }
            .stat-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
            .stat-value { font-size: 14px; font-weight: 800; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
            th { background-color: #0f172a; color: #ffffff; text-align: left; padding: 6px 8px; font-weight: 700; text-transform: uppercase; font-size: 9px; }
            td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer-sign { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 16px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid; }
            .sign-col { width: 220px; text-align: center; }
            .sign-line { border-bottom: 1px solid #0f172a; height: 35px; margin-bottom: 4px; }
            .sign-name { font-weight: 800; font-size: 10px; }
            .sign-title { color: #64748b; font-size: 9px; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #3730a3; font-weight: 600;">Official Financial & Fee Ledger ready for print / save as PDF.</span>
            <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; cursor: pointer;">Print / Save as PDF</button>
          </div>

          <div class="header-box">
            <div class="header-left">
              <img src="${SCHOOL_INFO.logo}" class="school-logo" alt="Logo" />
              <div>
                <h1 class="school-title">${SCHOOL_INFO.name}</h1>
                <p class="school-sub">Office of the Bursar & Accounts Directorate • ${SCHOOL_INFO.address}</p>
                <p class="school-sub">Free Quality School Education (FQSE) Subsidies & Tuition Financial Ledger</p>
              </div>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 13px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">Tuition Accounts Ledger</p>
              <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Audit Date: ${dateString}</p>
              <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Currency: Sierra Leone New Leones (SLE)</p>
            </div>
          </div>

          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-label">Total Annual Billed</div>
              <div class="stat-value">SLE ${totalAnnualBilled.toLocaleString()}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total Revenue Collected</div>
              <div class="stat-value" style="color: #047857;">SLE ${totalAnnualPaid.toLocaleString()}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total Outstanding Balance</div>
              <div class="stat-value" style="color: #b91c1c;">SLE ${totalAnnualBalance.toLocaleString()}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Collection Rate</div>
              <div class="stat-value" style="color: #4338ca;">${collectionRate}%</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th>Admission No</th>
                <th>Student Full Name</th>
                <th>Class</th>
                <th style="text-align: right;">T1 Due</th>
                <th style="text-align: right;">T2 Due</th>
                <th style="text-align: right;">T3 Due</th>
                <th style="text-align: right;">Total Billed</th>
                <th style="text-align: right;">Total Paid</th>
                <th style="text-align: right;">Balance (SLE)</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-sign">
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-name">Bursar / Financial Controller</div>
              <div class="sign-title">Givers World Mission Bursary</div>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-name">${SCHOOL_INFO.principalName}</div>
              <div class="sign-title">${SCHOOL_INFO.principalTitle}</div>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <div class="sign-name">Auditor / Board Representative</div>
              <div class="sign-title">Financial Oversight Committee</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      setSuccessMessage('Financial Ledger PDF document opened for printing / save.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage('Failed to generate printable financial PDF view.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // 2. Import / Restore Data from JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Validation checks
        if (!['Givers World Mission School Records Manager', 'Naiahcom School Records Manager', 'Salone Model Academy Records Manager'].includes(json.app) || !json.payload) {
          throw new Error('Invalid backup file signature.');
        }

        const { students: impStuds, records: impRecs, examPreps: impPreps, fees: impFees } = json.payload;

        if (!Array.isArray(impStuds) || !Array.isArray(impRecs) || !Array.isArray(impPreps) || !Array.isArray(impFees)) {
          throw new Error('Malformed backup database records structure.');
        }

        onRestoreData({
          students: impStuds,
          records: impRecs,
          examPreps: impPreps,
          fees: impFees
        });

        setSuccessMessage(`Database restored successfully. Loaded ${impStuds.length} student files.`);
        setErrorMessage('');
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to parse database backup file. Ensure it is a valid NS/SMA JSON file.');
        setSuccessMessage('');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // clear input
  };

  return (
    <div className="space-y-6" id="data-backup-portal">
      {/* Informative Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Backup & Administration Center</h2>
        <p className="text-xs text-slate-400">Export database backups, generate official audit reports, or restore registry data</p>
      </div>

      {/* BULK EXPORT FEATURE: External Reporting & Audit Center */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5" id="bulk-export-center">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bulk Export & External Reporting</h3>
              <p className="text-xs text-slate-500">
                Official ministerial and administrative export formats for MBSSE, District Education Office Kambia, and School Audits
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            MBSSE & Audit Compliant
          </span>
        </div>

        {/* 2-Column Bulk Export Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Module 1: Student Master Register */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Student Master Register</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Export all {students.length} registered students including Admission Number, Class, Stream, Parent / Guardian information, contact numbers, and medical data.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={handleExportStudentsCSV}
                className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                title="Download full student master register as CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportStudentsPDF}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                title="Open official formatted student register for printing or saving as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Official PDF</span>
              </button>
            </div>
          </div>

          {/* Module 2: Financial & Tuition Fee Ledgers */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Financial & Tuition Fee Ledgers</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Audit breakdown of Term 1, Term 2, and Term 3 dues, collections, and outstanding receivable balances in Sierra Leone New Leones (SLE).
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={handleExportFeesCSV}
                className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                title="Download financial ledger and fees audit as CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportFeesPDF}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                title="Open official bursary tuition ledger for printing or saving as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Export & Import Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Export Database */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Download School Backup</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a completely compiled database snapshot file containing all registered students, term continuous assessments, exam prep predictors, and fee histories. Keep this file safe on your computer as a terminal backup.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> SECURE JSON SIGNATURE
            </span>
            <button
              onClick={handleExport}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <FileJson className="w-4 h-4" /> Download Backup (.json)
            </button>
          </div>
        </div>

        {/* Card 2: Restore Database */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Upload & Restore Database</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload a previously downloaded NS/SMA backup file (`.json`) to completely restore your student lists, continuous assessments, and payment records. Restoring will overwrite the current live browser database state.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <span className="text-slate-400 font-semibold">OVERWRITES LIVE STATE</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Database className="w-4 h-4" /> Upload Backup File
            </button>
          </div>
        </div>

      </div>

      {/* Alerts Row */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-100 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-indigo-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-100 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Card 3: Production Go-Live & Database Maintenance Operations */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Production Go-Live & Clean Slate Controls
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Prepare Givers World Mission School for official deployment or sandbox testing.
            </p>
          </div>
          <span className={`self-start sm:self-auto text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
            students.length === 0 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${students.length === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            {students.length === 0 ? 'Live Mode: Clean Production Slate' : 'Data Loaded: Active Records'}
          </span>
        </div>

        {/* Database Partition Summary */}
        {(() => {
          const audit = getDatabaseAuditCounts();
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Students Enrolled</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{students.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Academic Records</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{records.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Fee Ledgers</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{fees.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Staff & Faculty</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{audit.teachers}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Library Catalog</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{audit.books} Books</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">School Fleet</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{audit.buses} Buses</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Attendance Logs</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{audit.attendance}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Disciplinary Logs</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{audit.incidents}</p>
              </div>
            </div>
          );
        })()}

        {/* Action 1: Delete All Data to Go Live */}
        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete All Data to Go Live
            </p>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Completely wipe all students, grades, fee transactions, faculty files, library items, bus routes, and attendance logs. This prepares the system with a 100% blank slate ready for real-world school admissions.
            </p>
          </div>

          <button
            onClick={() => {
              setWipeConfirmText('');
              setIsWipeModalOpen(true);
            }}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <Trash2 className="w-4 h-4" /> Delete All Data (Go Live)
          </button>
        </div>

        {/* Action 2: Optional Sandbox Demo Data */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5 max-w-xl">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Populate Sample Demo Data (Staging / Testing Only)
            </p>
            <p className="text-[11px] text-slate-500">
              Only use this if you need to preview sample Sierra Leone school data (students, grades, WASSCE preps, fees).
            </p>
          </div>

          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Load Sample Demo Data
          </button>
        </div>
      </div>

      {/* 5. INSTITUTIONAL DATA ENTRY REFERENCE ARCHIVE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6" id="data-entry-reference-archive">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
                <Archive className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Institutional Data Entry Reference Archive</h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {referenceEntries.length} Recorded
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Every student admission, terminal grade assessment, tuition receipt, staff appointment, and record deletion is permanently archived here for institutional reference, auditing, and historic recovery.
            </p>
          </div>

          {/* Quick Export Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => exportReferenceEntriesCSV(filteredReferences)}
              disabled={filteredReferences.length === 0}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Download RFC 4180 CSV spreadsheet of saved references"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV Ledger
            </button>
            <button
              onClick={() => exportReferenceEntriesJSON(filteredReferences)}
              disabled={filteredReferences.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Download full JSON archive of saved references"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400" /> Export JSON Archive
            </button>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reference #, student name, action or performer..."
              value={refSearch}
              onChange={(e) => setRefSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 text-slate-800"
            />
            {refSearch && (
              <button
                onClick={() => setRefSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Registry', 'Academics', 'Finance', 'Staff', 'Library', 'System'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setRefCategory(cat)}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  refCategory === cat
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Reference Entries Table / List */}
        {(() => {
          if (filteredReferences.length === 0) {
            return (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                <Archive className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-700">No reference entries matching filter</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  {referenceEntries.length === 0 
                    ? 'No entries have been saved yet. As students are registered, payments received, and grades updated, immutable reference snapshots will be stored here.'
                    : 'Try clearing your search query or choosing another category filter.'}
                </p>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Reference #</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Category & Type</th>
                    <th className="py-2.5 px-3">Description & Summary</th>
                    <th className="py-2.5 px-3">Performed By</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReferences.map((entry) => {
                    const statusColor = 
                      entry.status === 'Deleted From Registry'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : entry.status === 'Historical Reference'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                    const catColor = 
                      entry.category === 'Finance'
                        ? 'bg-emerald-100 text-emerald-800'
                        : entry.category === 'Academics'
                        ? 'bg-indigo-100 text-indigo-800'
                        : entry.category === 'Registry'
                        ? 'bg-blue-100 text-blue-800'
                        : entry.category === 'Staff'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-800';

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {entry.referenceNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {entry.formattedDate}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${catColor}`}>
                            {entry.category}
                          </span>
                          <span className="font-semibold text-slate-800">{entry.type}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{entry.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">{entry.summary}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                          {entry.performedBy}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedEntryDetail(entry)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                            title="Inspect complete JSON reference details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* MODAL 1: Confirm Delete All Data (Go Live) */}
      <AnimatePresence>
        {isWipeModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsWipeModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-950">Confirm Deleting All Data for Go-Live</h3>
                  <p className="text-xs text-rose-700">Completely wipe database records to start 100% clean.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2 leading-relaxed">
                <p className="font-bold">This operation will permanently purge:</p>
                <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px]">
                  <li>All student enrollment files ({students.length} students)</li>
                  <li>All academic terminal marks & report cards ({records.length} records)</li>
                  <li>All WAEC / National exam milestones ({examPreps.length} preps)</li>
                  <li>All tuition fee ledgers & receipts ({fees.length} accounts)</li>
                  <li>Faculty records, library checkouts, bus fleet, and attendance logs</li>
                </ul>
                <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium">
                  <strong>Permanent Reference Guarantee:</strong> A formal wipe record will be documented in the Institutional Reference Archive so you can always verify system history.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  To confirm, type <span className="font-mono text-rose-600 font-black">DELETE</span> below:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={wipeConfirmText}
                  onChange={(e) => setWipeConfirmText(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWipeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={wipeConfirmText.trim().toUpperCase() !== 'DELETE'}
                  onClick={() => {
                    recordDataEntry({
                      type: 'Database System Wipe',
                      category: 'System',
                      title: 'Live Clean Slate Purge Executed',
                      summary: `User executed total system wipe. All active operational records cleared for clean slate production.`,
                      status: 'Historical Reference'
                    });
                    wipeAllSystemData();
                    onResetData();
                    setReferenceEntries(getAllReferenceEntries());
                    setIsWipeModalOpen(false);
                    setSuccessMessage('All records deleted successfully! The system is now 100% clean and ready for live production.');
                    setTimeout(() => setSuccessMessage(''), 5000);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Wipe All Data & Go Live
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Confirm Load Sample Demo Data */}
      <AnimatePresence>
        {isDemoModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDemoModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Load Sample Demo Dataset?</h3>
                  <p className="text-xs text-slate-500">Populate staging sample data for testing.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                This will load sample Sierra Leone school records (students, grades, national exam preps, fee ledgers) into your local staging session.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onLoadDemoData) {
                      onLoadDemoData();
                    }
                    setIsDemoModalOpen(false);
                    setSuccessMessage('Sample demo data loaded for sandbox testing.');
                    setTimeout(() => setSuccessMessage(''), 4000);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Load Sample Dataset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: View Reference Entry Detail Snapshot */}
      <AnimatePresence>
        {selectedEntryDetail && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedEntryDetail(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 bg-slate-900 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{selectedEntryDetail.title}</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedEntryDetail.referenceNumber} • {selectedEntryDetail.formattedDate}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntryDetail(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
                    <span className="font-bold text-slate-800">{selectedEntryDetail.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                    <span className="font-bold text-slate-800">{selectedEntryDetail.type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Performer</span>
                    <span className="font-bold text-slate-800">{selectedEntryDetail.performedBy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                    <span className="font-bold text-slate-800">{selectedEntryDetail.status}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Summary Record</span>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                    {selectedEntryDetail.summary}
                  </p>
                </div>

                {selectedEntryDetail.details && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Archived Data Payload (JSON)</span>
                    <pre className="p-4 bg-slate-900 text-indigo-300 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60 border border-slate-800">
                      {JSON.stringify(selectedEntryDetail.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedEntryDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close Snapshot
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
