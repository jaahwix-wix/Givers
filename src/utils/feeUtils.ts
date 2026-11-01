/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, StudentFeeLedger } from '../types';

export interface PendingFeeStudent {
  student: Student;
  feeLedger: StudentFeeLedger;
  term: number;
  totalDue: number;
  paidAmount: number;
  balance: number;
  status: 'Unpaid' | 'Partial';
}

/**
 * Identifies students with 'Unpaid' or 'Partial' fee status for the given term (defaults to current term 3)
 */
export function getPendingFeeStudents(
  students: Student[],
  fees: StudentFeeLedger[],
  term: number = 3
): PendingFeeStudent[] {
  const pendingList: PendingFeeStudent[] = [];

  students.forEach(student => {
    if (student.status !== 'Active') return;
    const ledger = fees.find(f => f.studentId === student.id);
    if (!ledger || !ledger.terms || !ledger.terms[term]) return;

    const termFee = ledger.terms[term];
    if ((termFee.status === 'Unpaid' || termFee.status === 'Partial') && termFee.balance > 0) {
      pendingList.push({
        student,
        feeLedger: ledger,
        term,
        totalDue: termFee.totalDue,
        paidAmount: termFee.paidAmount,
        balance: termFee.balance,
        status: termFee.status as 'Unpaid' | 'Partial'
      });
    }
  });

  return pendingList;
}
