/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  MapPin, 
  Phone, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  UserCheck, 
  ShieldCheck, 
  X,
  Compass
} from 'lucide-react';
import { Student, StudentClass } from '../types';
import { CLASSES_LIST } from '../constants';
import { 
  syncSupabaseCollection, 
  batchSaveToSupabase, 
  saveToSupabase, 
  deleteFromSupabase 
} from '../services/supabaseSync';

interface BusManagementProps {
  students: Student[];
}

interface SchoolBus {
  id: string;
  name: string;
  licensePlate: string;
  driverName: string;
  driverPhone: string;
  routeDescription: string;
  capacity: number;
  status: 'Idle' | 'In Transit' | 'Completed' | 'Maintenance';
}

const DEFAULT_BUSES: SchoolBus[] = [];

export default function BusManagement({ students }: BusManagementProps) {
  const [buses, setBuses] = useState<SchoolBus[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({}); // studentId -> busId
  
  // Tabs: Fleet, Student Assignments
  const [activeTab, setActiveTab] = useState<'fleet' | 'assignments'>('fleet');
  
  // Search & Filters for assignments
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<StudentClass | 'All'>('All');
  const [busFilter, setBusFilter] = useState<string | 'All'>('All');

  // Modal for adding/editing bus
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<SchoolBus | null>(null);
  const [busToDelete, setBusToDelete] = useState<SchoolBus | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formLicensePlate, setFormLicensePlate] = useState('');
  const [formDriverName, setFormDriverName] = useState('');
  const [formDriverPhone, setFormDriverPhone] = useState('');
  const [formRoute, setFormRoute] = useState('');
  const [formCapacity, setFormCapacity] = useState(30);
  const [formStatus, setFormStatus] = useState<SchoolBus['status']>('Idle');

  // Load state from Supabase or local storage
  useEffect(() => {
    const unsubBuses = syncSupabaseCollection<SchoolBus>(
      'buses',
      'sma_buses',
      (items) => setBuses(items),
      DEFAULT_BUSES
    );

    // Load bus assignments
    const loadAssignments = () => {
      try {
        const cached = localStorage.getItem('sma_bus_assignments');
        if (cached) {
          setAssignments(JSON.parse(cached));
        }
      } catch {}
    };
    loadAssignments();

    const handleWiped = () => {
      setBuses([]);
      setAssignments({});
    };

    window.addEventListener('sma_database_wiped', handleWiped);

    return () => {
      unsubBuses();
      window.removeEventListener('sma_database_wiped', handleWiped);
    };
  }, []);

  // Save changes helper
  const saveBuses = (updatedBuses: SchoolBus[]) => {
    setBuses(updatedBuses);
    try {
      localStorage.setItem('sma_buses', JSON.stringify(updatedBuses));
    } catch {}
    batchSaveToSupabase('buses', updatedBuses);
  };

  const saveAssignments = (updatedAssignments: Record<string, string>) => {
    setAssignments(updatedAssignments);
    try {
      localStorage.setItem('sma_bus_assignments', JSON.stringify(updatedAssignments));
    } catch {}
    saveToSupabase('bus_assignments', 'active_allocations', {
      id: 'active_allocations',
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString()
    });
  };

  // Bus Modal handlers
  const handleOpenAdd = () => {
    setEditingBus(null);
    setFormName('');
    setFormLicensePlate('');
    setFormDriverName('');
    setFormDriverPhone('');
    setFormRoute('');
    setFormCapacity(30);
    setFormStatus('Idle');
    setIsBusModalOpen(true);
  };

  const handleOpenEdit = (bus: SchoolBus) => {
    setEditingBus(bus);
    setFormName(bus.name);
    setFormLicensePlate(bus.licensePlate);
    setFormDriverName(bus.driverName);
    setFormDriverPhone(bus.driverPhone);
    setFormRoute(bus.routeDescription);
    setFormCapacity(bus.capacity);
    setFormStatus(bus.status);
    setIsBusModalOpen(true);
  };

  const handleBusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBus) {
      // Edit
      const updated = buses.map(b => b.id === editingBus.id ? {
        ...b,
        name: formName,
        licensePlate: formLicensePlate,
        driverName: formDriverName,
        driverPhone: formDriverPhone,
        routeDescription: formRoute,
        capacity: formCapacity,
        status: formStatus
      } : b);
      saveBuses(updated);
    } else {
      // Create
      const newBus: SchoolBus = {
        id: `bus-${Date.now()}`,
        name: formName,
        licensePlate: formLicensePlate,
        driverName: formDriverName,
        driverPhone: formDriverPhone,
        routeDescription: formRoute,
        capacity: formCapacity,
        status: formStatus
      };
      saveBuses([...buses, newBus]);
    }
    setIsBusModalOpen(false);
  };

  const handleBusDelete = (id: string) => {
    const b = buses.find(item => item.id === id);
    if (b) {
      setBusToDelete(b);
    }
  };

  const confirmBusDelete = () => {
    if (!busToDelete) return;
    const b = busToDelete;
    const updatedBuses = buses.filter(item => item.id !== b.id);
    saveBuses(updatedBuses);
    deleteFromSupabase('buses', b.id);
    
    // Remove assignments
    const updatedAssignments = { ...assignments };
    Object.keys(updatedAssignments).forEach(studId => {
      if (updatedAssignments[studId] === b.id) {
        delete updatedAssignments[studId];
      }
    });
    saveAssignments(updatedAssignments);
    setBusToDelete(null);
  };

  // Assign Student
  const handleAssignStudent = (studentId: string, busId: string) => {
    const updated = { ...assignments };
    if (busId === 'None') {
      delete updated[studentId];
    } else {
      updated[studentId] = busId;
    }
    saveAssignments(updated);
  };

  // Filter students for assignments
  const activeStudents = students.filter(s => s.status === 'Active');
  const filteredStudents = activeStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'All' || s.currentClass === classFilter;
    
    const studentBusId = assignments[s.id] || 'None';
    const matchesBus = busFilter === 'All' || 
                       (busFilter === 'None' && studentBusId === 'None') || 
                       (studentBusId === busFilter);

    return matchesSearch && matchesClass && matchesBus;
  });

  // Calculate stats for each bus
  const getBusOccupancy = (busId: string) => {
    return Object.values(assignments).filter(id => id === busId).length;
  };

  return (
    <div className="space-y-6" id="school-bus-management">
      {/* Header card with flag styling */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="flex h-1 w-full overflow-hidden absolute top-0 left-0">
          <div className="bg-emerald-500 w-1/3"></div>
          <div className="bg-white w-1/3"></div>
          <div className="bg-blue-500 w-1/3"></div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700 font-mono">
                Fleet & Logistics
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
                School Bus Services
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
              <Bus className="w-7 h-7 text-indigo-500" /> Transit & Transportation Center
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage school bus schedules, tracking routes, driver registers, and student pick-up logs.</p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="self-start sm:self-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Bus
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200" id="bus-tabs">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'fleet'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bus className="w-4 h-4" /> Fleet & Routes
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'assignments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" /> Student Bus Pass Registry
        </button>
      </div>

      {/* Main Panel Content */}
      {activeTab === 'fleet' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="bus-fleet-tab">
          
          {/* List of active bus cards */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Transport Fleet ({buses.length})</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buses.map(bus => {
                const assignedCount = getBusOccupancy(bus.id);
                const capacityPercentage = Math.round((assignedCount / bus.capacity) * 100);
                
                const statusStyles = {
                  'In Transit': 'bg-amber-50 text-amber-700 border-amber-100',
                  'Idle': 'bg-slate-50 text-slate-500 border-slate-100',
                  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  'Maintenance': 'bg-rose-50 text-rose-700 border-rose-100'
                };

                return (
                  <div key={bus.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-indigo-400 border border-slate-800">
                            <Bus className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              {bus.licensePlate}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm mt-1">{bus.name}</h4>
                          </div>
                        </div>

                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${statusStyles[bus.status] || 'bg-slate-50 text-slate-500'}`}>
                          {bus.status}
                        </span>
                      </div>

                      {/* Route Map description */}
                      <div className="mt-4 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex gap-2 items-start">
                        <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Line Route</span>
                          <p className="font-semibold text-slate-700 mt-0.5 leading-relaxed">{bus.routeDescription}</p>
                        </div>
                      </div>

                      {/* Driver contacts */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                        <div className="p-2 bg-slate-50/50 rounded-lg">
                          <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Conductor Driver</span>
                          <span className="font-bold text-slate-700">{bus.driverName}</span>
                        </div>
                        <div className="p-2 bg-slate-50/50 rounded-lg">
                          <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Phone Contact</span>
                          <a href={`tel:${bus.driverPhone}`} className="font-bold text-indigo-600 hover:underline flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" /> {bus.driverPhone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Progress occupancy bar */}
                    <div className="mt-4 pt-3 border-t border-slate-50 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">Bus Load Factor</span>
                        <span className={capacityPercentage > 90 ? 'text-rose-600' : 'text-slate-600'}>
                          {assignedCount} / {bus.capacity} seats ({capacityPercentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            capacityPercentage > 90 ? 'bg-rose-500' : (capacityPercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500')
                          }`}
                          style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(bus)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Details
                      </button>
                      <button
                        onClick={() => handleBusDelete(bus.id)}
                        className="flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                        title="Delete Bus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map Tracking simulator (Visually highly polished) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
              <Compass className="w-4 h-4 text-indigo-600 animate-spin" /> Real-Time Transit Tracker
            </h3>

            <div className="rounded-xl border border-slate-200 bg-slate-900 h-64 relative overflow-hidden flex flex-col justify-between p-4 shadow-inner">
              {/* Grid background effect */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              {/* Virtual routes diagram */}
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-800 -translate-y-1/2"></div>
              <div className="absolute top-1/4 bottom-1/4 left-1/2 w-1 bg-slate-800 -translate-x-1/2"></div>

              {/* Pingers & markers representing buses */}
              <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-slate-900 shadow-md"></span>
                <span className="bg-slate-800/90 text-[8px] font-bold px-1 py-0.5 rounded text-white mt-1.5 border border-slate-700 whitespace-nowrap">Bus 1 (Regent)</span>
              </div>

              <div className="absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-slate-500 border-2 border-slate-900 shadow-md"></span>
                <span className="bg-slate-800/90 text-[8px] font-bold px-1 py-0.5 rounded text-white mt-1.5 border border-slate-700 whitespace-nowrap">Bus 2 (Lumley)</span>
              </div>

              <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900 shadow-md"></span>
                <span className="bg-slate-800/90 text-[8px] font-bold px-1 py-0.5 rounded text-white mt-1.5 border border-slate-700 whitespace-nowrap">Bus 3 (Completed)</span>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-[9px] border border-white">
                  S
                </div>
                <span className="bg-indigo-950/90 text-[8px] font-bold px-1 py-0.5 rounded text-indigo-300 mt-1.5 border border-indigo-900">CAMPUS</span>
              </div>

              {/* Simulated time info overlay */}
              <div className="relative z-10 flex justify-between items-start text-white w-full">
                <span className="bg-slate-950/80 px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border border-slate-800 flex items-center gap-1 text-emerald-400">
                  ● ONLINE GPS FEED
                </span>
                <span className="bg-slate-950/80 px-2 py-0.5 rounded text-[8px] font-mono border border-slate-800 text-slate-300">
                  Freetown, SL
                </span>
              </div>

              <div className="relative z-10 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
                <p className="font-bold text-white flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400 animate-pulse" /> Live Dispatch Estimations
                </p>
                <p className="text-slate-400 leading-normal">
                  Yellow Shuttle (Bus 1) is currently crossing Hill Station. Est. arrival to campus: <span className="text-amber-400 font-bold">12 mins</span>.
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2 text-xs">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Commuter Route Safety
              </span>
              <p className="text-indigo-700 leading-relaxed">
                All vehicles carry active insurance papers, standard safety fire kits, first-aid boxes, and speed control governors compliant with Sierra Leone road transport regulations.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Assignments tab */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" id="bus-assignments-tab">
          
          {/* Filtering row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students to assign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value as any)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Grades (Pre 1 - University)</option>
                {CLASSES_LIST.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              {/* Bus Filter */}
              <select
                value={busFilter}
                onChange={(e) => setBusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Bus Pass Tiers</option>
                <option value="None">No Bus Assigned</option>
                {buses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student assignments list table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Grade Class</th>
                  <th className="py-3 px-3">Primary Guardian</th>
                  <th className="py-3 px-3">Assigned Bus Route</th>
                  <th className="py-3 px-4">Bus Pass Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((student) => {
                  const studentBusId = assignments[student.id] || 'None';
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {student.profileImage ? (
                            <img
                              src={student.profileImage}
                              alt={student.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{student.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{student.admissionNumber}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold">{student.currentClass}</span>
                        {student.stream && <span className="text-[9px] text-indigo-500 ml-1">({student.stream})</span>}
                      </td>

                      <td className="py-3 px-3">
                        <p className="text-slate-700 font-semibold">{student.parentName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{student.parentPhone}</p>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={studentBusId}
                          onChange={(e) => handleAssignStudent(student.id, e.target.value)}
                          className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="None">❌ Walk / Private Commute</option>
                          {buses.map(b => (
                            <option key={b.id} value={b.id}>🚌 {b.name}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        {studentBusId !== 'None' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <CheckCircle className="w-3 h-3" /> ACTIVE COMMUTE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                            NO BUS PASS
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <UserCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">No students found matching your filter criteria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bus Modal (Add / Edit) */}
      {isBusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Bus className="w-5 h-5 text-indigo-600" /> {editingBus ? 'Edit School Bus' : 'Add New School Bus'}
              </h3>
              <button 
                onClick={() => setIsBusModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleBusSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bus Name / Label</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Kambia Express Shuttle"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">License Plate</label>
                  <input
                    type="text"
                    required
                    value={formLicensePlate}
                    onChange={(e) => setFormLicensePlate(e.target.value)}
                    placeholder="e.g. SL-584-B"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Seat Capacity</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={100}
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Route Description</label>
                <input
                  type="text"
                  required
                  value={formRoute}
                  onChange={(e) => setFormRoute(e.target.value)}
                  placeholder="e.g. Kambia 2 - Town Center - School Campus"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={formDriverName}
                    onChange={(e) => setFormDriverName(e.target.value)}
                    placeholder="Driver full name"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Driver Phone</label>
                  <input
                    type="text"
                    required
                    value={formDriverPhone}
                    onChange={(e) => setFormDriverPhone(e.target.value)}
                    placeholder="e.g. +232 76 000000"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Transit Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 bg-white cursor-pointer"
                >
                  <option value="Idle">Idle (Inactive / Depot)</option>
                  <option value="In Transit">In Transit (Active Commute)</option>
                  <option value="Completed">Completed (Riders Dropped Off)</option>
                  <option value="Maintenance">Maintenance (Workshop)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Bus details
                </button>
                <button
                  type="button"
                  onClick={() => setIsBusModalOpen(false)}
                  className="py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Bus */}
      {busToDelete && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBusToDelete(null);
          }}
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete School Bus?</h3>
                <p className="text-xs text-slate-500">Remove transport vehicle from active fleet.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
              <p className="font-bold text-slate-900">{busToDelete.name}</p>
              <p className="text-slate-600">Plate: {busToDelete.licensePlate} • Driver: {busToDelete.driverName} ({busToDelete.driverPhone})</p>
              <p className="text-slate-500">Route: {busToDelete.routeDescription}</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
              Deleting this bus will automatically unassign all students currently routed to it.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBusToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBusDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Bus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
