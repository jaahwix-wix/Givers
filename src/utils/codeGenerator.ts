/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Teacher, Student } from '../types';

/**
 * Generates a random alphanumeric code with a distinct prefix
 */
export function generateTeacherCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TCH-${num}`;
}

export function generateParentCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PAR-${num}`;
}

export function generateStudentCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `STD-${num}`;
}

/**
 * Ensures a teacher object has an assigned access code
 */
export function ensureTeacherAccessCode(teacher: Teacher): Teacher {
  if (teacher.accessCode && teacher.accessCode.trim() !== '') {
    return teacher;
  }
  return {
    ...teacher,
    accessCode: generateTeacherCode(),
  };
}

/**
 * Ensures a student object has assigned parent & student access codes
 */
export function ensureStudentAccessCodes(student: Student): Student {
  let updated = { ...student };
  if (!updated.parentAccessCode || updated.parentAccessCode.trim() === '') {
    updated.parentAccessCode = generateParentCode();
  }
  if (!updated.studentAccessCode || updated.studentAccessCode.trim() === '') {
    updated.studentAccessCode = updated.admissionNumber || generateStudentCode();
  }
  return updated;
}

/**
 * Search teacher by access code or email or staffId
 */
export function findTeacherByCode(teachers: Teacher[], rawInput: string): Teacher | undefined {
  const clean = rawInput.trim().toUpperCase();
  if (!clean) return undefined;
  return teachers.find(t => 
    (t.accessCode && t.accessCode.toUpperCase() === clean) ||
    (t.staffId && t.staffId.toUpperCase() === clean) ||
    (t.email && t.email.toUpperCase() === clean) ||
    t.id.toUpperCase() === clean
  );
}

/**
 * Search student record by parent code or student admission number
 */
export function findStudentByParentCode(students: Student[], rawInput: string): Student | undefined {
  const clean = rawInput.trim().toUpperCase();
  if (!clean) return undefined;
  return students.find(s => 
    (s.parentAccessCode && s.parentAccessCode.toUpperCase() === clean) ||
    (s.admissionNumber && s.admissionNumber.toUpperCase() === clean) ||
    (s.parentPhone && s.parentPhone.replace(/\s+/g, '') === clean.replace(/\s+/g, ''))
  );
}

/**
 * Search student record by student code or admission number
 */
export function findStudentByStudentCode(students: Student[], rawInput: string): Student | undefined {
  const clean = rawInput.trim().toUpperCase();
  if (!clean) return undefined;
  return students.find(s => 
    (s.studentAccessCode && s.studentAccessCode.toUpperCase() === clean) ||
    (s.admissionNumber && s.admissionNumber.toUpperCase() === clean)
  );
}
