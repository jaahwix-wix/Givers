/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  X, 
  UserPlus,
  User,
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Check,
  CircleDot,
  Camera,
  Upload,
  Image,
  CreditCard,
  Heart,
  ShieldAlert,
  Users,
  Printer,
  ShieldCheck,
  Clock,
  Lock,
  CheckCircle2,
  ChevronDown,
  SlidersHorizontal,
  RotateCcw,
  GraduationCap,
  Award,
  KeyRound,
  Copy,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { Student, StudentClass, SSSStream, UniversityProgram } from '../types';
import { CLASSES_LIST, SSS_STREAMS, UNIVERSITY_PROGRAMS } from '../constants';
import { SCHOOL_INFO } from '../initialData';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import StudentIdCardModal from './StudentIdCardModal';
import StudentAttendancePanel from './StudentAttendancePanel';
import StudentDisciplinaryPanel from './StudentDisciplinaryPanel';
import { compressImageBase64 } from '../services/firestoreSync';
import { recordDataEntry } from '../utils/referenceLog';

interface StudentListProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onNavigate: (tab: string, arg?: any) => void;
  initialSearch?: string;
  initialSelectedStudentId?: string;
}

export default function StudentList({ 
  students, 
  onAddStudent, 
  onUpdateStudent, 
  onDeleteStudent, 
  onNavigate,
  initialSearch,
  initialSelectedStudentId
}: StudentListProps) {
  // Filters & State
  const [search, setSearch] = useState('');

  // Handle incoming initial search or student selection
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    } else if (initialSelectedStudentId) {
      const target = students.find(s => s.id === initialSelectedStudentId);
      if (target) {
        setSearch(target.admissionNumber || target.name);
      }
    }
  }, [initialSearch, initialSelectedStudentId, students]);
  const [selectedClass, setSelectedClass] = useState<StudentClass | 'All'>('All');
  const [selectedStream, setSelectedStream] = useState<SSSStream | 'All'>('All');
  const [selectedProgram, setSelectedProgram] = useState<UniversityProgram | 'All'>('All');
  const [selectedGender, setSelectedGender] = useState<'All' | 'Male' | 'Female'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Transferred' | 'Graduated'>('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // ID Card Generator States
  const [isIdCardGeneratorOpen, setIsIdCardGeneratorOpen] = useState(false);
  const [idCardSelectedStudent, setIdCardSelectedStudent] = useState<Student | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female'>('Male');
  const [formClass, setFormClass] = useState<StudentClass>('Primary 1');
  const [formStream, setFormStream] = useState<SSSStream | undefined>(undefined);
  const [formUniversityProgram, setFormUniversityProgram] = useState<UniversityProgram>('Diploma');
  const [formSection, setFormSection] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEnrollmentYear, setFormEnrollmentYear] = useState(new Date().getFullYear());
  const [formStatus, setFormStatus] = useState<'Active' | 'Transferred' | 'Graduated'>('Active');
  const [formProfileImage, setFormProfileImage] = useState<string | undefined>(undefined);

  // Medical Record & SubTab States
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'medical' | 'attendance' | 'disciplinary'>('directory');
  const [formAllergies, setFormAllergies] = useState('');
  const [formBloodType, setFormBloodType] = useState('');
  const [formEmergencyName, setFormEmergencyName] = useState('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');
  const [formEmergencyRelation, setFormEmergencyRelation] = useState('');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [copiedParentCode, setCopiedParentCode] = useState<string | null>(null);

  // In-app deletion modals & batch operations
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Auto clear toast notice
  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => setToastNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotice]);

  // Authentication & Verification Permissions (Only Administrator can verify)
  const { role, can } = useAuth();
  const canVerify = role === 'admin' || can('canVerifyStaffAndStudents');
  const [formVerified, setFormVerified] = useState(false);

  // Toggle student verification (Administrator only)
  const handleToggleVerifyStudent = (student: Student) => {
    if (!canVerify) {
      setToastNotice({
        type: 'error',
        message: `Access Restricted: Only the Administrator (${SCHOOL_INFO.principalName}) is authorized to verify student records.`
      });
      return;
    }
    const newStatus = !student.verified;
    const updated: Student = {
      ...student,
      verified: newStatus,
      verifiedBy: newStatus ? `${SCHOOL_INFO.principalName} (Admin)` : undefined,
      verifiedAt: newStatus ? new Date().toISOString().split('T')[0] : undefined,
    };
    onUpdateStudent(updated);
    setToastNotice({
      type: 'success',
      message: `Student file ${student.name} is now ${newStatus ? 'Officially Verified' : 'Unverified'}.`
    });
  };

  // Safe In-App Deletion Executions
  const handleConfirmSingleDelete = () => {
    if (!studentToDelete) return;
    const target = studentToDelete;
    onDeleteStudent(target.id);
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      next.delete(target.id);
      return next;
    });
    setToastNotice({
      type: 'success',
      message: `${target.name}'s file was deleted from active registry and safely recorded in Reference Archive.`
    });
    setStudentToDelete(null);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedStudentIds.size === 0) return;
    const count = selectedStudentIds.size;
    selectedStudentIds.forEach(id => {
      onDeleteStudent(id);
    });
    setSelectedStudentIds(new Set());
    setIsBulkDeleteModalOpen(false);
    setToastNotice({
      type: 'success',
      message: `${count} student files deleted and archived in Institutional Reference Ledger.`
    });
  };

  const handleConfirmDeleteAll = () => {
    if (students.length === 0) return;
    const count = students.length;
    students.forEach(s => {
      onDeleteStudent(s.id);
    });
    setSelectedStudentIds(new Set());
    setIsDeleteAllModalOpen(false);
    setToastNotice({
      type: 'success',
      message: `All ${count} student records have been cleared from active roster and permanently archived.`
    });
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  // Camera Management States & Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Cleanup camera stream on modal close or unmount
  useEffect(() => {
    if (!isModalOpen) {
      stopCamera();
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isModalOpen]);

  // Start camera helper
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 400 }, height: { ideal: 400 }, facingMode: 'user' }
      });
      setCameraStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Could not access camera. Please check permissions or upload a file.');
      setIsCameraActive(false);
    }
  };

  // Take Snapshot
  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth, video.videoHeight) || 300;
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Center crop to make 1:1 square
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormProfileImage(dataUrl);
      }
      stopCamera();
    }
  };

  // Upload File handler with automatic thumbnail compression for Firestore efficiency
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const raw = reader.result as string;
        try {
          const compressed = await compressImageBase64(raw, 300, 0.75);
          setFormProfileImage(compressed);
        } catch {
          setFormProfileImage(raw);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger modal for editing
  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    const fullName = (student.name || '').trim();
    const parts = fullName.split(/\s+/);
    if (parts.length > 1) {
      setFormFirstName(parts.slice(0, -1).join(' '));
      setFormLastName(parts[parts.length - 1]);
    } else {
      setFormFirstName(fullName);
      setFormLastName('');
    }
    setFormName(fullName);
    setFormDob(student.dateOfBirth);
    setFormGender(student.gender);
    setFormClass(student.currentClass);
    setFormStream(student.stream);
    setFormUniversityProgram(student.universityProgram || 'Diploma');
    setFormSection(student.classSection || '');
    setFormParentName(student.parentName);
    setFormParentPhone(student.parentPhone);
    setFormAddress(student.address);
    setFormEnrollmentYear(student.enrollmentYear);
    setFormStatus(student.status);
    setFormProfileImage(student.profileImage);
    setFormAllergies(student.allergies || '');
    setFormBloodType(student.bloodType || '');
    setFormEmergencyName(student.emergencyContactName || '');
    setFormEmergencyPhone(student.emergencyContactPhone || '');
    setFormEmergencyRelation(student.emergencyContactRelation || '');
    setFormVerified(student.verified || false);
    setCameraError(null);
    setIsCameraActive(false);
    setFormValidationError(null);
    setIsModalOpen(true);
  };

  // Trigger modal for creating
  const handleAddClick = () => {
    setEditingStudent(null);
    setFormFirstName('');
    setFormLastName('');
    setFormName('');
    setFormDob('');
    setFormGender('Male');
    setFormClass('Primary 1');
    setFormStream(undefined);
    setFormUniversityProgram('Diploma');
    setFormSection('A');
    setFormParentName('');
    setFormParentPhone('');
    setFormAddress('');
    setFormEnrollmentYear(new Date().getFullYear());
    setFormStatus('Active');
    setFormProfileImage(undefined);
    setFormAllergies('');
    setFormBloodType('');
    setFormEmergencyName('');
    setFormEmergencyPhone('');
    setFormEmergencyRelation('');
    setFormVerified(false);
    setCameraError(null);
    setIsCameraActive(false);
    setFormValidationError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);
    const resolvedName = (formName.trim() || `${formFirstName} ${formLastName}`.trim()).trim();
    if (!resolvedName || !formParentName.trim() || !formParentPhone.trim()) {
      setFormValidationError('Please fill in the required fields: Student Name, Parent/Guardian Name, and Parent Phone Number.');
      return;
    }

    if (formClass.startsWith('University') && !formUniversityProgram) {
      setFormValidationError('For university enrollment, the student must select either Certificate or Diploma.');
      return;
    }

    if (editingStudent) {
      // Update
      const isNowVerified = canVerify ? formVerified : (editingStudent.verified || false);
      const updated: Student = {
        ...editingStudent,
        name: resolvedName,
        dateOfBirth: formDob,
        gender: formGender,
        currentClass: formClass,
        stream: formClass.startsWith('SSS') ? (formStream || 'Science') : undefined,
        universityProgram: formClass.startsWith('University') ? (formUniversityProgram || 'Diploma') : undefined,
        classSection: formSection || 'A',
        parentName: formParentName,
        parentPhone: formParentPhone,
        address: formAddress,
        enrollmentYear: formEnrollmentYear,
        status: formStatus,
        profileImage: formProfileImage,
        allergies: formAllergies,
        bloodType: formBloodType,
        emergencyContactName: formEmergencyName,
        emergencyContactPhone: formEmergencyPhone,
        emergencyContactRelation: formEmergencyRelation,
        verified: isNowVerified,
        verifiedBy: isNowVerified ? (editingStudent.verifiedBy || `${SCHOOL_INFO.principalName} (Admin)`) : undefined,
        verifiedAt: isNowVerified ? (editingStudent.verifiedAt || new Date().toISOString().split('T')[0]) : undefined,
      };
      onUpdateStudent(updated);
    } else {
      // Create
      const newId = `stud-${Date.now()}`;
      const admissionNum = `NS-${formEnrollmentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
      const isNowVerified = canVerify ? formVerified : false;
      const newStudent: Student = {
        id: newId,
        name: resolvedName,
        admissionNumber: admissionNum,
        dateOfBirth: formDob || '2015-01-01',
        gender: formGender,
        currentClass: formClass,
        stream: formClass.startsWith('SSS') ? (formStream || 'Science') : undefined,
        universityProgram: formClass.startsWith('University') ? (formUniversityProgram || 'Diploma') : undefined,
        classSection: formSection || 'A',
        parentName: formParentName,
        parentPhone: formParentPhone,
        address: formAddress || 'Freetown, Sierra Leone',
        enrollmentYear: formEnrollmentYear,
        status: formStatus,
        verified: isNowVerified,
        verifiedBy: isNowVerified ? `${SCHOOL_INFO.principalName} (Admin)` : undefined,
        verifiedAt: isNowVerified ? new Date().toISOString().split('T')[0] : undefined,
        profileColor: ['emerald', 'blue', 'purple', 'rose', 'pink', 'amber', 'teal', 'cyan', 'sky'][Math.floor(Math.random() * 9)],
        profileImage: formProfileImage,
        allergies: formAllergies,
        bloodType: formBloodType,
        emergencyContactName: formEmergencyName,
        emergencyContactPhone: formEmergencyPhone,
        emergencyContactRelation: formEmergencyRelation,
      };
      onAddStudent(newStudent);
    }
    stopCamera();
    setIsModalOpen(false);
  };

  // Count of active filters
  const activeFiltersCount = (selectedClass !== 'All' ? 1 : 0) +
                             (selectedStream !== 'All' ? 1 : 0) +
                             (selectedProgram !== 'All' ? 1 : 0) +
                             (selectedGender !== 'All' ? 1 : 0) +
                             (selectedStatus !== 'All' ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedClass('All');
    setSelectedStream('All');
    setSelectedProgram('All');
    setSelectedGender('All');
    setSelectedStatus('All');
    setSearch('');
  };

  // Filter students based on state
  const filteredStudents = students.filter(student => {
    const sName = student.name || '';
    const sAdm = student.admissionNumber || '';
    const sClass = student.currentClass || '';
    const matchesSearch = sName.toLowerCase().includes(search.toLowerCase()) || 
                          sAdm.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === 'All' || sClass === selectedClass;
    const matchesStream = selectedStream === 'All' || 
                          (sClass.startsWith('SSS') && student.stream === selectedStream);
    const matchesProgram = selectedProgram === 'All' || 
                          (sClass.startsWith('University') && student.universityProgram === selectedProgram);
    const matchesGender = selectedGender === 'All' || student.gender === selectedGender;
    const matchesStatus = selectedStatus === 'All' || student.status === selectedStatus;
    
    return matchesSearch && matchesClass && matchesStream && matchesProgram && matchesGender && matchesStatus;
  });

  return (
    <div className="space-y-6" id="student-list-tab-panel">
      {/* Title & Add student button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Student Directory</h2>
          <p className="text-xs text-slate-400">Search, filter, and register student records from Pre 1 through University</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {canVerify && students.length > 0 && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold text-xs transition-colors shadow-xs cursor-pointer"
              title="Purge all student files from directory"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete All Records
            </button>
          )}
          <button 
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4.5 h-4.5" /> Export PDF / Print
          </button>
          <button 
            onClick={() => {
              if (onNavigate) {
                onNavigate('id-cards');
              } else {
                setIdCardSelectedStudent(null);
                setIsIdCardGeneratorOpen(true);
              }
            }}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200/60 font-semibold text-sm transition-colors shadow-xs cursor-pointer"
          >
            <CreditCard className="w-4.5 h-4.5" /> ID Cards & Badges
          </button>
          <button 
            onClick={handleAddClick}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Register New Student
          </button>
        </div>
      </div>

      {/* Floating In-App Toast Notice */}
      {toastNotice && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 border shadow-sm transition-all ${
          toastNotice.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : toastNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-indigo-50 border-indigo-200 text-indigo-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{toastNotice.message}</span>
          </div>
          <button onClick={() => setToastNotice(null)} className="p-1 hover:opacity-70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk Selection Action Bar */}
      {selectedStudentIds.size > 0 && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-800">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-[11px]">
              {selectedStudentIds.size}
            </span>
            <span>student record{selectedStudentIds.size > 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStudentIds(new Set())}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedStudentIds.size})
            </button>
          </div>
        </div>
      )}

      {/* Sub tabs: Directory vs Medical Records */}
      <div className="flex border-b border-slate-200/80 mt-2" id="directory-subtabs">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-2 py-2.5 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'directory'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" /> Student Directory
        </button>
        <button
          onClick={() => setActiveSubTab('medical')}
          className={`flex items-center gap-2 py-2.5 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'medical'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-400 hover:text-rose-600'
          }`}
        >
          <Heart className="w-4 h-4" /> Medical Records
        </button>
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-2 py-2.5 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-emerald-600'
          }`}
        >
          <Calendar className="w-4 h-4" /> Daily Attendance
        </button>
        <button
          onClick={() => setActiveSubTab('disciplinary')}
          className={`flex items-center gap-2 py-2.5 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'disciplinary'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-indigo-600'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Behavior & Merits
        </button>
      </div>

      {/* Filter Bar */}
      {(activeSubTab === 'directory' || activeSubTab === 'medical') && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3.5" id="student-filters">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            {/* Search Bar with Integrated Filter Dropdown Button & Popover */}
            <div className="lg:col-span-5 relative" ref={filterDropdownRef}>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  id="student-search-input"
                  placeholder="Search Name or Admission ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-24 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700 placeholder-slate-400 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 cursor-pointer"
                    title="Clear search text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {/* Search Bar Filter Dropdown Trigger Button */}
                <button
                  type="button"
                  id="student-search-filter-dropdown-btn"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFiltersCount > 0
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : isFilterDropdownOpen
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-2xs'
                  }`}
                  title="Filter by Class, Gender, or Status"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                  {activeFiltersCount > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-white text-indigo-700 text-[10px] font-black flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  ) : (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </div>

              {/* Filter Dropdown Popover */}
              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    id="student-search-filter-dropdown-menu"
                    className="absolute top-full left-0 mt-2 w-full sm:w-[380px] bg-white rounded-3xl border border-slate-200 shadow-xl p-5 z-50 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-bold text-slate-800 text-sm">Filter Student Files</h4>
                        {activeFiltersCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                            {activeFiltersCount} active
                          </span>
                        )}
                      </div>
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>

                    {/* Filter Option 1: Current Class */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Current Class Level
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => {
                          const val = (e.target.value || '') as StudentClass | 'All';
                          setSelectedClass(val);
                          if (!val.startsWith('SSS') && !val.startsWith('University')) setSelectedStream('All');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="All">All Class Levels (Pre 1 to University)</option>
                        {CLASSES_LIST.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* If SSS or University class or All: Stream */}
                    {(selectedClass === 'All' || (selectedClass && (selectedClass.startsWith('SSS') || selectedClass.startsWith('University')))) && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                          {(selectedClass || '').startsWith('University') ? 'Faculty / Stream' : 'Academic Stream'}
                        </label>
                        <select
                          value={selectedStream}
                          onChange={(e) => setSelectedStream(e.target.value as SSSStream | 'All')}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="All">All Streams & Faculties</option>
                          {SSS_STREAMS.map(s => (
                            <option key={s} value={s}>{s} Stream</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* If University or All: Program Award (Certificate vs Diploma) */}
                    {(selectedClass === 'All' || (selectedClass && selectedClass.startsWith('University'))) && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                          University Program
                        </label>
                        <select
                          value={selectedProgram}
                          onChange={(e) => setSelectedProgram(e.target.value as UniversityProgram | 'All')}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="All">All Programs (Certificate & Diploma)</option>
                          <option value="Certificate">Certificate Program</option>
                          <option value="Diploma">Diploma Program</option>
                        </select>
                      </div>
                    )}

                    {/* Filter Option 2: Gender */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Student Gender
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { val: 'All', label: 'All' },
                          { val: 'Male', label: 'Boys' },
                          { val: 'Female', label: 'Girls' }
                        ].map(item => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setSelectedGender(item.val as any)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              selectedGender === item.val
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter Option 3: Status */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Enrollment Status
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { val: 'All', label: 'All Statuses' },
                          { val: 'Active', label: 'Active' },
                          { val: 'Transferred', label: 'Transferred' },
                          { val: 'Graduated', label: 'Graduated' },
                        ].map(item => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setSelectedStatus(item.val as any)}
                            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border text-left flex items-center justify-between transition-all cursor-pointer ${
                              selectedStatus === item.val
                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>{item.label}</span>
                            {selectedStatus === item.val && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Footer with Result Counter and Apply */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        Matches: <strong className="text-slate-900 font-mono">{filteredStudents.length}</strong> students
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsFilterDropdownOpen(false)}
                        className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Dropdown: Current Class */}
            <div className="lg:col-span-3 relative flex items-center">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedClass}
                onChange={(e) => {
                  const val = (e.target.value || '') as StudentClass | 'All';
                  setSelectedClass(val);
                  if (!val.startsWith('SSS') && !val.startsWith('University')) setSelectedStream('All');
                }}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-700 appearance-none cursor-pointer"
              >
                <option value="All">All Classes (Pre 1 - University)</option>
                {CLASSES_LIST.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>

            {/* Quick Dropdown: Gender */}
            <div className="lg:col-span-2 relative flex items-center">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value as 'All' | 'Male' | 'Female')}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-700 appearance-none cursor-pointer"
              >
                <option value="All">All Genders</option>
                <option value="Male">Boys Only</option>
                <option value="Female">Girls Only</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>

            {/* Quick Dropdown: Status */}
            <div className="lg:col-span-2 relative flex items-center">
              <CircleDot className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'All' | 'Active' | 'Transferred' | 'Graduated')}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-700 appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Transferred">Transferred</option>
                <option value="Graduated">Graduated</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {(activeFiltersCount > 0 || search) && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
              <span className="text-[11px] font-semibold text-slate-400">Active Filters:</span>
              
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  Search: "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-indigo-900 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedClass !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  Class: {selectedClass}
                  <button onClick={() => { setSelectedClass('All'); setSelectedStream('All'); }} className="hover:text-indigo-900 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedGender !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  Gender: {selectedGender === 'Male' ? 'Boys' : 'Girls'}
                  <button onClick={() => setSelectedGender('All')} className="hover:text-indigo-900 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStatus !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  Status: {selectedStatus}
                  <button onClick={() => setSelectedStatus('All')} className="hover:text-indigo-900 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStream !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  Stream: {selectedStream}
                  <button onClick={() => setSelectedStream('All')} className="hover:text-indigo-900 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedProgram !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                  Program: {selectedProgram}
                  <button onClick={() => setSelectedProgram('All')} className="hover:text-emerald-900 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 ml-auto flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Clear All ({filteredStudents.length} of {students.length} students)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Student List View Grid */}
      {activeSubTab === 'attendance' ? (
        <StudentAttendancePanel students={students} />
      ) : activeSubTab === 'disciplinary' ? (
        <StudentDisciplinaryPanel students={students} />
      ) : activeSubTab === 'medical' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="student-medical-grid">
          {filteredStudents.map((student) => {
            const initials = student.name.split(' ').map(n => n[0]).join('');
            const bType = student.bloodType || 'Unknown';
            const hasAllergies = student.allergies && student.allergies.trim().toLowerCase() !== 'none' && student.allergies.trim().toLowerCase() !== '';
            
            return (
              <motion.div 
                layout
                key={`med-${student.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between"
                id={`student-medical-card-${student.id}`}
              >
                <div>
                  {/* Top: Student Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {student.profileImage ? (
                        <img
                          src={student.profileImage}
                          alt={student.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm">
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {student.admissionNumber}
                          </span>
                          {student.status && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              student.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : student.status === 'Transferred'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {student.status}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 text-base mt-1 truncate max-w-[150px]">{student.name}</h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-100">
                        {student.currentClass}
                      </span>
                      {student.universityProgram && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1 uppercase tracking-wider">
                          <Award className="w-2.5 h-2.5 text-emerald-600" />
                          {student.universityProgram}
                        </span>
                      )}
                      {student.stream && !student.universityProgram && (
                        <span className="text-[9px] font-medium text-indigo-600 mt-1 uppercase tracking-wider">
                          {student.stream}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Medical Details Content */}
                  <div className="mt-5 space-y-4 pt-4 border-t border-slate-50">
                    {/* Blood Type & Allergies row */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4 flex flex-col items-center justify-center bg-rose-50/50 rounded-xl p-2.5 border border-rose-100/60">
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Blood Group</span>
                        <span className="text-lg font-black text-rose-700 mt-1">{bType}</span>
                      </div>
                      
                      <div className="col-span-8 bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <ShieldAlert className={`w-3.5 h-3.5 ${hasAllergies ? 'text-amber-500' : 'text-slate-400'}`} />
                          Allergies / Risks
                        </span>
                        <p className={`text-xs font-semibold truncate ${hasAllergies ? 'text-amber-700' : 'text-slate-500'}`} title={student.allergies}>
                          {student.allergies || 'No documented allergies'}
                        </p>
                      </div>
                    </div>

                    {/* Emergency Contact Block */}
                    <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-100/80 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Emergency Contact
                      </span>
                      {student.emergencyContactName ? (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-700 font-semibold">
                            <span>{student.emergencyContactName}</span>
                            <span className="text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                              {student.emergencyContactRelation || 'Contact'}
                            </span>
                          </div>
                          {student.emergencyContactPhone ? (
                            <a 
                              href={`tel:${student.emergencyContactPhone}`}
                              className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{student.emergencyContactPhone}</span>
                            </a>
                          ) : (
                            <p className="text-slate-400 italic text-[11px]">No contact number provided</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs italic py-1">
                          No specific emergency contact set. Fallback to Primary Parent:
                          <div className="mt-1.5 font-semibold text-slate-600 not-italic">
                            {student.parentName} ({student.parentPhone})
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Rail */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <button 
                    onClick={() => handleEditClick(student)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" /> Update Medical Details
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              <Heart className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold">No medical records found</p>
              <p className="text-xs text-slate-400 mt-1">Refine your active search filters or register a new record.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="student-grid">
          {filteredStudents.map((student) => {
            const initials = student.name.split(' ').map(n => n[0]).join('');
            
            // Set color theme depending on gender or stream
            const colorStyles = {
              emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800',
              blue: 'bg-blue-50 border-blue-100 text-blue-800',
              purple: 'bg-purple-50 border-purple-100 text-purple-800',
              rose: 'bg-rose-50 border-rose-100 text-rose-800',
              pink: 'bg-pink-50 border-pink-100 text-pink-800',
              amber: 'bg-amber-50 border-amber-100 text-amber-800',
              teal: 'bg-teal-50 border-teal-100 text-teal-800',
              cyan: 'bg-cyan-50 border-cyan-100 text-cyan-800',
              sky: 'bg-sky-50 border-sky-100 text-sky-800',
            };

            const sColor = (student.profileColor || 'emerald') as keyof typeof colorStyles;
            const chosenStyle = colorStyles[sColor] || colorStyles.emerald;

            return (
              <motion.div 
                layout
                key={student.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all relative overflow-hidden group"
                id={`student-card-${student.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectStudent(student.id);
                      }}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer p-0.5 rounded transition-colors"
                      title={selectedStudentIds.has(student.id) ? "Deselect student" : "Select student for batch actions"}
                    >
                      {selectedStudentIds.has(student.id) ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                      )}
                    </button>
                    {student.profileImage ? (
                      <img
                        src={student.profileImage}
                        alt={student.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${chosenStyle}`}>
                        {initials}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {student.admissionNumber}
                        </span>
                        {student.status && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                            student.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : student.status === 'Transferred'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {student.status}
                          </span>
                        )}
                        {student.verified ? (
                          <span 
                            className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title={`Officially Verified by ${student.verifiedBy || SCHOOL_INFO.principalName} on ${student.verifiedAt || '2025/2026 Session'}`}
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200"
                            title="Pending official Administrator verification"
                          >
                            <Clock className="w-3 h-3 text-amber-600" /> Unverified
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 text-base mt-1 truncate max-w-[150px]">{student.name}</h3>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-100">
                      {student.currentClass}
                    </span>
                    {student.stream && (
                      <span className="text-[9px] font-medium text-indigo-600 mt-1 uppercase tracking-wider">
                        {student.stream}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bio Details */}
                <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-500 space-y-2">
                  {/* System-Generated Parent Access Code */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50/80 border border-sky-200/60 text-[11px]">
                    <div className="flex items-center gap-1.5 font-medium text-sky-950">
                      <KeyRound className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="font-bold">Parent Code:</span>
                      <span className="font-mono font-extrabold text-sky-800">{student.parentAccessCode || 'Pending'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (student.parentAccessCode) {
                          navigator.clipboard.writeText(student.parentAccessCode);
                          setCopiedParentCode(student.parentAccessCode);
                          setTimeout(() => setCopiedParentCode(null), 2000);
                        }
                      }}
                      className="text-sky-600 hover:text-sky-900 p-0.5 rounded cursor-pointer transition-colors"
                      title="Copy Parent Portal Access Code"
                    >
                      {copiedParentCode === student.parentAccessCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{student.parentPhone} ({student.parentName})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 truncate" />
                    <span className="truncate max-w-[200px]">{student.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>DOB: {student.dateOfBirth} | Year: {student.enrollmentYear}</span>
                  </div>
                </div>

                {/* Card Action Rails */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold gap-1.5 flex-wrap sm:flex-nowrap">
                  <button 
                    onClick={() => onNavigate('report-card', { studentId: student.id })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-100/30 transition-colors cursor-pointer"
                    title="View report card"
                  >
                    <FileText className="w-3.5 h-3.5" /> Report
                  </button>

                  <button 
                    onClick={() => {
                      setIdCardSelectedStudent(student);
                      setIsIdCardGeneratorOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50 transition-colors cursor-pointer"
                    title="Generate ID card"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> ID Card
                  </button>

                  {/* Administrator-Only Student Verification Button */}
                  {canVerify ? (
                    <button
                      type="button"
                      onClick={() => handleToggleVerifyStudent(student)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        student.verified
                          ? 'bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-700 border border-emerald-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                      title={student.verified ? 'Click to revoke student verification' : `Verify student file (Principal: ${SCHOOL_INFO.principalName})`}
                    >
                      <ShieldCheck className={`w-3.5 h-3.5 ${student.verified ? 'text-emerald-600' : 'text-white'}`} />
                      <span>{student.verified ? 'Verified' : 'Verify'}</span>
                    </button>
                  ) : (
                    <div 
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-50 border border-slate-200/50 text-slate-400 text-[10px] font-semibold select-none cursor-not-allowed"
                      title={`Student verification is restricted to the Administrator (${SCHOOL_INFO.principalName})`}
                    >
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>{student.verified ? 'Verified' : 'Unverified'}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEditClick(student)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/50 transition-colors cursor-pointer"
                      title="Edit Record"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setStudentToDelete(student)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100/50 transition-colors cursor-pointer"
                      title="Delete Student File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              <UserPlus className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold">No students found</p>
              <p className="text-xs text-slate-400 mt-1">Refine your active search filters or register a new record.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add/Edit student */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden" 
            id="student-modal"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsModalOpen(false);
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header (Fixed at top) */}
              <div className="flex justify-between items-center bg-slate-900 text-white p-4 sm:p-5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-white">
                      {editingStudent ? 'Edit Student File' : 'Register New Student'}
                    </h3>
                    <p className="text-slate-400 text-xs">Standard West African student enrollment & academic profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                  {formValidationError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{formValidationError}</span>
                    </div>
                  )}
                  
                  {/* 1. PRIMARY IDENTITY & PROFILE PHOTO SECTION */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                    {/* Student Full Name - Split into First Name & Last Name */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" /> Student Name <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-medium">West African Academic Registry</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">
                            First Name / Given Name <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            type="text" 
                            required
                            value={formFirstName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormFirstName(val);
                              setFormName(`${val} ${formLastName}`.trim());
                            }}
                            placeholder="e.g. Samuel"
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">
                            Last Name / Surname <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            type="text" 
                            required
                            value={formLastName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormLastName(val);
                              setFormName(`${formFirstName} ${val}`.trim());
                            }}
                            placeholder="e.g. Kargbo"
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Official Formatted Name Preview */}
                      <div className="flex items-center justify-between text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-500 font-medium">Official Name on Records:</span>
                        <span className="font-bold text-indigo-700">
                          {formName.trim() || `${formFirstName} ${formLastName}`.trim() || (
                            <span className="italic text-slate-400 font-normal">Enter first and last name</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Photo + Date of Birth + Gender in one compact row */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start pt-3 border-t border-slate-200/60">
                      {/* Compact Profile Photo */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="relative w-20 h-20 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center group shadow-inner shrink-0">
                          {isCameraActive ? (
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : formProfileImage ? (
                            <img
                              src={formProfileImage}
                              alt="Preview"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-slate-400 text-center flex flex-col items-center justify-center p-1">
                              <Image className="w-6 h-6 text-slate-300 mb-0.5" />
                              <span className="text-[9px] font-semibold text-slate-400">No Photo</span>
                            </div>
                          )}

                          {!isCameraActive && formProfileImage && (
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setFormProfileImage(undefined)}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                                title="Remove Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Student Photo</span>
                          {isCameraActive ? (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={captureSnapshot}
                                className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Camera className="w-3 h-3" /> Snap
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="py-1 px-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={startCamera}
                                className="py-1 px-2.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Camera className="w-3 h-3" /> Camera
                              </button>
                              <label className="py-1 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors">
                                <Upload className="w-3 h-3 text-slate-500" /> Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                          {cameraError && (
                            <p className="text-[10px] text-rose-500 font-medium">{cameraError}</p>
                          )}
                        </div>
                      </div>

                      {/* DOB & Gender */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Date of Birth</label>
                          <input 
                            type="date" 
                            value={formDob}
                            onChange={(e) => setFormDob(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Gender</label>
                          <div className="flex gap-4 pt-2">
                            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                              <input 
                                type="radio" 
                                name="gender" 
                                checked={formGender === 'Male'} 
                                onChange={() => setFormGender('Male')} 
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              Male
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                              <input 
                                type="radio" 
                                name="gender" 
                                checked={formGender === 'Female'} 
                                onChange={() => setFormGender('Female')}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              Female
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. ACADEMIC ENROLLMENT SECTION */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" /> Academic Placement
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Class Level */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Class Level <span className="text-rose-500">*</span></label>
                        <select
                          value={formClass}
                          onChange={(e) => {
                            const val = (e.target.value || '') as StudentClass;
                            setFormClass(val);
                            if ((val.startsWith('SSS') || val.startsWith('University')) && !formStream) {
                              setFormStream('Science');
                            } else if (!val.startsWith('SSS') && !val.startsWith('University')) {
                              setFormStream(undefined);
                            }
                          }}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 bg-white"
                        >
                          {CLASSES_LIST.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Stream (conditional for SSS and University) */}
                      {((formClass || '').startsWith('SSS') || (formClass || '').startsWith('University')) ? (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">
                            {(formClass || '').startsWith('University') ? 'Faculty / Discipline' : 'Academic Stream'}
                          </label>
                          <select
                            value={formStream || 'Science'}
                            onChange={(e) => setFormStream(e.target.value as SSSStream)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 bg-white"
                          >
                            {SSS_STREAMS.map(s => (
                              <option key={s} value={s}>{s} {(formClass || '').startsWith('University') ? 'Faculty' : 'Stream'}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Class Section / Arm</label>
                          <input 
                            type="text" 
                            value={formSection}
                            onChange={(e) => setFormSection(e.target.value)}
                            placeholder="e.g. A, B, Alpha, Blue"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                          />
                        </div>
                      )}

                      {/* University Program Offer: Certificate or Diploma (MANDATORY FOR UNIVERSITY) */}
                      {(formClass || '').startsWith('University') && (
                        <div className="sm:col-span-2 bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4 text-indigo-600" />
                              University Program Offer <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                              Certificate or Diploma
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Select the university qualification program for this student (Certificate or Diploma required):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {UNIVERSITY_PROGRAMS.map(prog => (
                              <button
                                key={prog.id}
                                type="button"
                                onClick={() => setFormUniversityProgram(prog.id)}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  formUniversityProgram === prog.id
                                    ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                                    : 'bg-white/60 border-slate-200 hover:border-indigo-300 hover:bg-white text-slate-700'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                  formUniversityProgram === prog.id
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}>
                                  {formUniversityProgram === prog.id && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                                    {prog.label}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block leading-tight">
                                    {prog.description}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* If SSS or University, show Section / Department here */}
                      {((formClass || '').startsWith('SSS') || (formClass || '').startsWith('University')) && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">
                            {(formClass || '').startsWith('University') ? 'Department / Cohort Group' : 'Class Section / Arm'}
                          </label>
                          <input 
                            type="text" 
                            value={formSection}
                            onChange={(e) => setFormSection(e.target.value)}
                            placeholder={(formClass || '').startsWith('University') ? "e.g. Dept of Computing, Cohort 1" : "e.g. A, B, Alpha, Blue"}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                          />
                        </div>
                      )}

                      {/* Admission Year */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Admission Enrollment Year</label>
                        <input 
                          type="number" 
                          value={formEnrollmentYear}
                          onChange={(e) => setFormEnrollmentYear(parseInt(e.target.value) || new Date().getFullYear())}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                        />
                      </div>

                      {/* Status */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Enrollment Status</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 bg-white"
                        >
                          <option value="Active">Active</option>
                          <option value="Transferred">Transferred</option>
                          <option value="Graduated">Graduated</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. PARENT & GUARDIAN DETAILS */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-600" /> Parent / Guardian Information
                      </h4>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                        Auto Access Code
                      </span>
                    </div>

                    {/* Auto-Generated Parent Code Notice */}
                    <div className="p-3 bg-sky-50/80 border border-sky-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase text-sky-900 tracking-wider block">Parent Portal Access Code</span>
                          <span className="text-xs font-mono font-bold text-sky-950">
                            {editingStudent?.parentAccessCode || 'Automatically generated by system upon enrollment (e.g. PAR-XXXX)'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                        Auto Generated
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Parent Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Parent / Guardian Full Name <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          required
                          value={formParentName}
                          onChange={(e) => setFormParentName(e.target.value)}
                          placeholder="e.g. Alhaji Kargbo"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                        />
                      </div>

                      {/* Parent Phone */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Parent Phone Contact <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          required
                          value={formParentPhone}
                          onChange={(e) => setFormParentPhone(e.target.value)}
                          placeholder="e.g. +232 76 XXXXXX"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                        />
                      </div>

                      {/* Address */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Home Address</label>
                        <textarea 
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          placeholder="e.g. 12 Wilkinson Road, Freetown"
                          rows={2}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. MEDICAL & EMERGENCY DETAILS */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500" /> Medical & Emergency Records
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Blood Type */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Blood Type</label>
                        <select
                          value={formBloodType}
                          onChange={(e) => setFormBloodType(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 bg-white"
                        >
                          <option value="">Unknown / Not Selected</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>

                      {/* Allergies */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Known Allergies</label>
                        <input 
                          type="text" 
                          value={formAllergies}
                          onChange={(e) => setFormAllergies(e.target.value)}
                          placeholder="e.g. Peanuts, Penicillin (leave empty if none)"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                        />
                      </div>

                      {/* Emergency Contact Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Emergency Contact Name</label>
                        <input 
                          type="text" 
                          value={formEmergencyName}
                          onChange={(e) => setFormEmergencyName(e.target.value)}
                          placeholder="e.g. Uncle Brima"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                        />
                      </div>

                      {/* Emergency Contact Phone & Relation */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Contact Phone</label>
                          <input 
                            type="text" 
                            value={formEmergencyPhone}
                            onChange={(e) => setFormEmergencyPhone(e.target.value)}
                            placeholder="e.g. +232 76 000000"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Relation</label>
                          <input 
                            type="text" 
                            value={formEmergencyRelation}
                            onChange={(e) => setFormEmergencyRelation(e.target.value)}
                            placeholder="e.g. Father, Aunt"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. OFFICIAL VERIFICATION & CLEARANCE (Admin Only) */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Administrative Verification & Clearance
                    </h4>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            Officially Verified File
                          </span>
                          {formVerified ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                              Verified
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {canVerify
                            ? `Authorized under Principal ${SCHOOL_INFO.principalName} (${SCHOOL_INFO.principalTitle}). Only administrators can toggle verification.`
                            : `Verification is restricted to the Administrator (${SCHOOL_INFO.principalName}). Staff cannot alter verification status.`}
                        </p>
                      </div>

                      {canVerify ? (
                        <button
                          type="button"
                          onClick={() => setFormVerified(!formVerified)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            formVerified
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {formVerified ? 'Verified ✓' : 'Mark Verified'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 shrink-0">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Admin Only</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit row (Fixed at bottom) */}
                <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-3 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> {editingStudent ? 'Update Student File' : 'Complete Registration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student ID Card Modal Component */}
      <StudentIdCardModal
        isOpen={isIdCardGeneratorOpen}
        onClose={() => {
          setIsIdCardGeneratorOpen(false);
          setIdCardSelectedStudent(null);
        }}
        students={students}
        initialStudent={idCardSelectedStudent}
      />

      {/* Full-Screen printable directory preview modal */}
      <AnimatePresence>
        {isPrintPreviewOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-8 flex justify-center print:bg-white print:p-0 print:absolute print:inset-auto" id="printable-directory-modal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-5xl shadow-xl border border-slate-100 flex flex-col print:border-none print:shadow-none print:rounded-none"
            >
              {/* Controller bar - hidden during print */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 rounded-t-3xl flex justify-between items-center print:hidden">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Printer className="w-4 h-4 text-indigo-600" /> Printable Document Preview
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Optimized for A4 Portrait paper printing and PDF export</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 py-1.5 px-4 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                  </button>
                  <button
                    onClick={() => setIsPrintPreviewOpen(false)}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Close
                  </button>
                </div>
              </div>

              {/* Document Sheet */}
              <div className="p-8 space-y-6 print:p-0 flex-1">
                {/* Sierra Leone National Colors ribbon */}
                <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                  <div className="bg-emerald-500 w-1/3"></div>
                  <div className="bg-white w-1/3 border-y border-slate-100"></div>
                  <div className="bg-blue-500 w-1/3"></div>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left border-b-2 border-slate-800 pb-5 gap-4">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white border-2 border-slate-800 font-bold shrink-0 relative overflow-hidden">
                      <span className="text-[10px] tracking-tight text-indigo-400 font-mono">GWM</span>
                      <span className="text-[7px] text-slate-400 font-sans uppercase text-center leading-tight">Givers</span>
                      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-full"></div>
                    </div>
                    
                    <div className="space-y-1">
                      <h1 className="text-xl font-black text-slate-800 tracking-tight font-sans uppercase">{SCHOOL_INFO.name}</h1>
                      <p className="text-[11px] font-bold text-indigo-600 italic">" {SCHOOL_INFO.motto} "</p>
                      <p className="text-[10px] text-slate-500 font-medium font-mono">{SCHOOL_INFO.address} | Phone: {SCHOOL_INFO.phone} | Web: {SCHOOL_INFO.website}</p>
                    </div>
                  </div>

                  <div className="text-center md:text-right md:shrink-0">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-md border border-slate-900">
                      Official Student Registry
                    </span>
                    <p className="text-xs font-bold text-slate-700 mt-2">Export Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-xs font-bold text-indigo-600">Document Type: Complete Student Directory</p>
                  </div>
                </div>

                {/* Directory Stats metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 text-xs font-medium text-slate-600 border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Total Registered</span>
                    <span className="font-extrabold text-slate-800 text-sm">{students.length} Students</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Active Enrolled</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{students.filter(s => s.status === 'Active').length} Active</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Transferred</span>
                    <span className="font-extrabold text-amber-700 text-sm">{students.filter(s => s.status === 'Transferred').length} Pupils</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Graduated Alumni</span>
                    <span className="font-extrabold text-indigo-700 text-sm">{students.filter(s => s.status === 'Graduated').length} Alumni</span>
                  </div>
                </div>

                {/* Directory Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Adm ID</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Class/Grade</th>
                        <th className="py-2.5 px-3">Gender</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Parent / Emergency Contact</th>
                        <th className="py-2.5 px-3">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {students.map((stud) => {
                        const statusColors = {
                          Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                          Transferred: 'bg-amber-50 text-amber-700 border-amber-100',
                          Graduated: 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        };

                        return (
                          <tr key={stud.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-indigo-600">{stud.admissionNumber}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{stud.name}</td>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-800">{stud.currentClass}</span>
                              {stud.universityProgram && (
                                <span className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                  {stud.universityProgram}
                                </span>
                              )}
                              {stud.stream && !stud.universityProgram && (
                                <span className="ml-1 text-slate-500 text-[10px]">({stud.stream})</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-500">{stud.gender}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-block font-black px-1.5 py-0.5 rounded text-[8px] border uppercase tracking-wider ${
                                statusColors[stud.status] || 'bg-slate-50 text-slate-500'
                              }`}>
                                {stud.status}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-700">{stud.parentName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{stud.parentPhone}</div>
                            </td>
                            <td className="py-2 px-3 text-slate-500 truncate max-w-[150px]">{stud.address}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer seal */}
                <div className="flex justify-between items-end pt-8 border-t border-slate-100 text-[10px] text-slate-400">
                  <div>
                    <p>Official school administration database release</p>
                    <p className="font-mono mt-0.5">SHA-256 Checksum: VERITAS-STUDENT-LEDGER-2026</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-700">{SCHOOL_INFO.principalName}</p>
                    <p className="italic">Principal & Co-Founder Seal & Signature</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Modal: Single Student Deletion Confirmation */}
      <AnimatePresence>
        {studentToDelete && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setStudentToDelete(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 overflow-hidden space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Delete Student Record?</h3>
                  <p className="text-xs text-slate-500">Remove student file from operational roster.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-900">{studentToDelete.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Admission ID:</span>
                  <span className="font-mono font-semibold text-slate-700">{studentToDelete.admissionNumber || studentToDelete.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Current Class:</span>
                  <span className="font-bold text-indigo-700">{studentToDelete.currentClass}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Guardian:</span>
                  <span className="text-slate-700">{studentToDelete.parentName} ({studentToDelete.parentPhone})</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Reference Ledger Protection:</strong> While active grades and fee balances are pruned, this entry is permanently logged into the institutional <strong>Reference Archive</strong> for administrative review.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSingleDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Student File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal: Bulk Delete Selected Confirmation */}
      <AnimatePresence>
        {isBulkDeleteModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsBulkDeleteModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 overflow-hidden space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Delete {selectedStudentIds.size} Selected Students?</h3>
                  <p className="text-xs text-slate-500">Selected student files will be removed from the active directory.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 leading-relaxed">
                You are about to batch delete <strong>{selectedStudentIds.size} students</strong> along with their related report cards, trial exam records, and fee accounts.
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-800 leading-relaxed">
                All deleted records are automatically documented in the permanent Reference Archive for compliance and audit retrieval.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Confirm Batch Delete ({selectedStudentIds.size})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal: Delete All Students Confirmation */}
      <AnimatePresence>
        {isDeleteAllModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDeleteAllModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 overflow-hidden space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-950">Delete All Student Records?</h3>
                  <p className="text-xs text-rose-700">Completely clears the student directory roster.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed space-y-2">
                <p>
                  This action will delete all <strong>{students.length} student files</strong> from the active operational database.
                </p>
                <p className="text-[11px] text-rose-600 font-medium">
                  The system will enter a blank slate ready for fresh student enrollment.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Wipe All {students.length} Records
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
