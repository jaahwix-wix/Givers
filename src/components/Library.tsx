/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Book, 
  BookOpen, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  UserMinus, 
  Trash2, 
  Edit, 
  X, 
  DollarSign,
  Barcode,
  CalendarCheck,
  Award,
  ShieldAlert,
  AlertCircle,
  Check
} from 'lucide-react';
import { Student } from '../types';
import { 
  syncFirestoreCollection, 
  saveToFirestore, 
  deleteFromFirestore 
} from '../services/firestoreSync';
import { recordDataEntry } from '../utils/referenceLog';

interface LibraryProps {
  students: Student[];
}

interface BookItem {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

interface CheckOutRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  studentClass?: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount: number; // SLL
  status: 'Checked Out' | 'Returned' | 'Overdue';
}

const DEFAULT_BOOKS: BookItem[] = [];

const DEFAULT_CHECKOUTS: CheckOutRecord[] = [];

export default function Library({ students }: LibraryProps) {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [checkouts, setCheckouts] = useState<CheckOutRecord[]>([]);
  
  // Tab Navigation: Catalog, Checkouts, Fines
  const [activeTab, setActiveTab] = useState<'catalog' | 'checkouts' | 'fines'>('catalog');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal forms
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  // Form Fields - Book
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formTotalCopies, setFormTotalCopies] = useState(5);

  // Modal Form - Check Out
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [checkoutDueDate, setCheckoutDueDate] = useState('');

  // In-app deletion and waive modals
  const [bookToDelete, setBookToDelete] = useState<BookItem | null>(null);
  const [checkoutToWaive, setCheckoutToWaive] = useState<CheckOutRecord | null>(null);
  const [libraryToast, setLibraryToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (libraryToast) {
      const timer = setTimeout(() => setLibraryToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [libraryToast]);

  useEffect(() => {
    const unsubBooks = syncFirestoreCollection<BookItem>(
      'library_books',
      'sma_library_books',
      (items) => setBooks(items),
      DEFAULT_BOOKS
    );

    const unsubCheckouts = syncFirestoreCollection<CheckOutRecord>(
      'library_checkouts',
      'sma_library_checkouts',
      (items) => setCheckouts(items),
      DEFAULT_CHECKOUTS
    );

    const handleWiped = () => {
      setBooks([]);
      setCheckouts([]);
    };

    window.addEventListener('sma_database_wiped', handleWiped);
    return () => {
      unsubBooks();
      unsubCheckouts();
      window.removeEventListener('sma_database_wiped', handleWiped);
    };
  }, []);

  // Sync / Calculate Overdue statuses & fines daily
  useEffect(() => {
    if (checkouts.length === 0) return;
    
    const today = new Date().toISOString().substring(0, 10);
    let changed = false;

    const updated = checkouts.map(co => {
      if (co.status === 'Checked Out' && new Date(co.dueDate) < new Date(today)) {
        // Overdue! Fine is SLL 1,000 per day late
        const diffTime = Math.abs(new Date(today).getTime() - new Date(co.dueDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fine = diffDays * 1000;
        
        changed = true;
        const modified = {
          ...co,
          status: 'Overdue' as const,
          fineAmount: fine
        };
        saveToFirestore('library_checkouts', co.id, modified);
        return modified;
      } else if (co.status === 'Overdue') {
        const diffTime = Math.abs(new Date(today).getTime() - new Date(co.dueDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fine = diffDays * 1000;
        if (co.fineAmount !== fine) {
          changed = true;
          const modified = {
            ...co,
            fineAmount: fine
          };
          saveToFirestore('library_checkouts', co.id, modified);
          return modified;
        }
      }
      return co;
    });

    if (changed) {
      setCheckouts(updated);
      localStorage.setItem('sma_library_checkouts', JSON.stringify(updated));
    }
  }, [checkouts]);

  // Save books
  const saveBooks = (newBooks: BookItem[]) => {
    setBooks(newBooks);
    localStorage.setItem('sma_library_books', JSON.stringify(newBooks));
  };

  // Save checkouts
  const saveCheckouts = (newCheckouts: CheckOutRecord[]) => {
    setCheckouts(newCheckouts);
    localStorage.setItem('sma_library_checkouts', JSON.stringify(newCheckouts));
  };

  // Handle Book catalog submissions
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setFormTitle('');
    setFormAuthor('');
    setFormIsbn('');
    setFormCategory('General');
    setFormTotalCopies(5);
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (b: BookItem) => {
    setEditingBook(b);
    setFormTitle(b.title);
    setFormAuthor(b.author);
    setFormIsbn(b.isbn);
    setFormCategory(b.category);
    setFormTotalCopies(b.totalCopies);
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBook) {
      // Edit Book
      const diff = formTotalCopies - editingBook.totalCopies;
      const updatedBook: BookItem = {
        ...editingBook,
        title: formTitle,
        author: formAuthor,
        isbn: formIsbn,
        category: formCategory,
        totalCopies: formTotalCopies,
        availableCopies: Math.max(0, editingBook.availableCopies + diff)
      };
      const updated = books.map(b => b.id === editingBook.id ? updatedBook : b);
      saveBooks(updated);
      saveToFirestore('library_books', updatedBook.id, updatedBook);
    } else {
      // Add Book
      const newBook: BookItem = {
        id: `b-${Date.now()}`,
        title: formTitle,
        author: formAuthor,
        isbn: formIsbn,
        category: formCategory,
        totalCopies: formTotalCopies,
        availableCopies: formTotalCopies
      };
      saveBooks([...books, newBook]);
      saveToFirestore('library_books', newBook.id, newBook);

      recordDataEntry({
        type: 'Library Book Acquisition',
        category: 'Library',
        title: `Book Added: ${newBook.title}`,
        summary: `Added "${newBook.title}" by ${newBook.author} (ISBN: ${newBook.isbn}, Category: ${newBook.category}, Copies: ${newBook.totalCopies}).`,
        targetId: newBook.id,
        details: newBook,
        status: 'Saved & Active'
      });
    }
    setIsBookModalOpen(false);
  };

  const handleBookDelete = (id: string) => {
    const b = books.find(item => item.id === id);
    if (b) {
      setBookToDelete(b);
    }
  };

  const confirmBookDelete = () => {
    if (!bookToDelete) return;
    const b = bookToDelete;
    const updated = books.filter(item => item.id !== b.id);
    saveBooks(updated);
    deleteFromFirestore('library_books', b.id);

    recordDataEntry({
      type: 'Library Book Acquisition',
      category: 'Library',
      title: `Book Removed: ${b.title}`,
      summary: `Catalog item "${b.title}" (ISBN: ${b.isbn}) removed from circulation. Preserved in Reference Archive.`,
      targetId: b.id,
      details: b,
      status: 'Deleted From Registry'
    });

    setLibraryToast({ type: 'success', message: `Book "${b.title}" deleted from catalog.` });
    setBookToDelete(null);
  };

  // Manage checkout/return handlers
  const handleOpenCheckout = (bookId?: string) => {
    setSelectedBookId(bookId || (books.length > 0 ? books[0].id : ''));
    setSelectedStudentId(students.length > 0 ? students[0].id : '');
    // Due 14 days from now
    setCheckoutDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
    setIsCheckoutModalOpen(true);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const book = books.find(b => b.id === selectedBookId);
    const student = students.find(s => s.id === selectedStudentId);

    if (!book || !student) return;
    if (book.availableCopies <= 0) {
      setLibraryToast({ type: 'error', message: 'Error: There are no available physical copies of this book currently.' });
      return;
    }

    // Deduct available copy
    const updatedBook: BookItem = {
      ...book,
      availableCopies: book.availableCopies - 1
    };
    const updatedBooks = books.map(b => b.id === book.id ? updatedBook : b);
    saveBooks(updatedBooks);
    saveToFirestore('library_books', updatedBook.id, updatedBook);

    // Create checkout record
    const newRecord: CheckOutRecord = {
      id: `co-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      studentId: student.id,
      studentName: student.name,
      studentClass: student.currentClass,
      issueDate: new Date().toISOString().substring(0, 10),
      dueDate: checkoutDueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      status: 'Checked Out',
      fineAmount: 0
    };

    const updatedCheckouts = [newRecord, ...checkouts];
    saveCheckouts(updatedCheckouts);
    saveToFirestore('library_checkouts', newRecord.id, newRecord);

    recordDataEntry({
      type: 'Library Book Checkout',
      category: 'Library',
      title: `Book Issued: "${book.title}" to ${student.name}`,
      summary: `Issued to ${student.name} (${student.currentClass}). Due date: ${newRecord.dueDate}.`,
      targetId: newRecord.id,
      details: newRecord,
      status: 'Saved & Active'
    });

    setIsCheckoutModalOpen(false);
    setLibraryToast({ type: 'success', message: `Book "${book.title}" issued to ${student.name}.` });
  };

  const handleReturnBook = (record: CheckOutRecord) => {
    const today = new Date().toISOString().substring(0, 10);
    const updatedRecord: CheckOutRecord = {
      ...record,
      status: 'Returned',
      returnDate: today
    };

    const updatedCheckouts = checkouts.map(co => co.id === record.id ? updatedRecord : co);
    saveCheckouts(updatedCheckouts);
    saveToFirestore('library_checkouts', updatedRecord.id, updatedRecord);

    // Restock book available copies
    const book = books.find(b => b.id === record.bookId);
    if (book) {
      const updatedBook: BookItem = {
        ...book,
        availableCopies: Math.min(book.totalCopies, book.availableCopies + 1)
      };
      const updatedBooks = books.map(b => b.id === book.id ? updatedBook : b);
      saveBooks(updatedBooks);
      saveToFirestore('library_books', updatedBook.id, updatedBook);
    }
    setLibraryToast({ type: 'success', message: `Book returned and inventory restocked.` });
  };

  const handleWaiveFine = (coId: string) => {
    const target = checkouts.find(co => co.id === coId);
    if (target) {
      setCheckoutToWaive(target);
    }
  };

  const confirmWaiveFine = () => {
    if (!checkoutToWaive) return;
    const target = checkoutToWaive;
    const updated = checkouts.map(co => co.id === target.id ? {
      ...co,
      fineAmount: 0
    } : co);
    saveCheckouts(updated);
    saveToFirestore('library_checkouts', target.id, { ...target, fineAmount: 0 });
    setLibraryToast({ type: 'success', message: `Overdue fine for ${target.studentName} waived successfully.` });
    setCheckoutToWaive(null);
  };

  // Filter Catalog
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.isbn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || b.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Categories list
  const categoriesList = Array.from(new Set(books.map(b => b.category)));

  // Analytics totals
  const checkedOutCount = checkouts.filter(co => co.status === 'Checked Out').length;
  const overdueCount = checkouts.filter(co => co.status === 'Overdue').length;
  const totalFines = checkouts.reduce((acc, curr) => acc + curr.fineAmount, 0);

  return (
    <div className="space-y-6" id="library-workspace">
      {libraryToast && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 border shadow-sm transition-all ${
          libraryToast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{libraryToast.message}</span>
          </div>
          <button onClick={() => setLibraryToast(null)} className="p-1 hover:opacity-70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Media Center Header */}
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
                Resource Center
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
                Library Catalogue
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-indigo-500" /> Library & Literature Registry
            </h2>
            <p className="text-xs text-slate-400 mt-1">Catalog reading books, track check-outs to students, issue overdue warning fines, and record book returns.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleOpenAddBook}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Catalog Book
            </button>
            <button
              onClick={() => handleOpenCheckout()}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4" /> Issue Book Pass
            </button>
          </div>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="library-stats">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Active Check-Outs</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block font-mono">{checkedOutCount} books</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Overdue Books</span>
            <span className="text-xl font-extrabold text-rose-600 mt-1 block font-mono">{overdueCount} books</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Overdue Fines</span>
            <span className="text-xl font-extrabold text-emerald-600 mt-1 block font-mono">SLL {totalFines.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200" id="library-tabs">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Book className="w-4 h-4" /> Book Catalogue
        </button>
        <button
          onClick={() => setActiveTab('checkouts')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'checkouts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <CalendarCheck className="w-4 h-4" /> Issue & Checkout Log
        </button>
        <button
          onClick={() => setActiveTab('fines')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'fines'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Overdue Fine Registry
        </button>
      </div>

      {/* Tab panel contents */}
      {activeTab === 'catalog' && (
        <div className="space-y-4" id="library-catalog-tab">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, author, or ISBN barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700 font-semibold"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Book Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map(book => {
              const availabilityPercent = Math.round((book.availableCopies / book.totalCopies) * 100);
              const isOut = book.availableCopies === 0;

              return (
                <div key={book.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-200 transition-all">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                        {book.category}
                      </span>

                      {isOut ? (
                        <span className="text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded">
                          No Copies Left
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
                          Available
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{book.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Author: <span className="font-semibold">{book.author}</span></p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <Barcode className="w-3.5 h-3.5 text-slate-300" /> ISBN: {book.isbn}
                    </div>

                    {/* physical copy availability bars */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">Available Stock</span>
                        <span className={isOut ? 'text-rose-600' : 'text-slate-700'}>
                          {book.availableCopies} of {book.totalCopies} copies
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isOut ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${availabilityPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-50 flex gap-2">
                    <button
                      onClick={() => handleOpenCheckout(book.id)}
                      disabled={isOut}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Issue Pass
                    </button>
                    <button
                      onClick={() => handleOpenEditBook(book)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 rounded-lg cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleBookDelete(book.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'checkouts' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4" id="library-checkouts-tab">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">Physical Book Issuing Ledger</h3>
          
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Issue Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Return Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {checkouts.map(co => {
                  const badgeStyles = {
                    'Checked Out': 'bg-indigo-50 text-indigo-700 border-indigo-100',
                    'Returned': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    'Overdue': 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                  };

                  return (
                    <tr key={co.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{co.bookTitle}</span>
                        <span className="text-[10px] font-mono text-slate-400">Barcode ID: {co.bookId}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-800">{co.studentName}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">ID: {co.studentId}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{co.issueDate}</td>
                      <td className="py-3 px-3 font-mono text-rose-500">{co.dueDate}</td>
                      <td className="py-3 px-3 font-mono text-emerald-600">{co.returnDate || '-'}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${badgeStyles[co.status]}`}>
                          {co.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {co.status !== 'Returned' ? (
                          <button
                            onClick={() => handleReturnBook(co)}
                            className="inline-flex items-center gap-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            <UserMinus className="w-3 h-3" /> Mark Returned
                          </button>
                        ) : (
                          <span className="text-emerald-600 text-[10px] font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Filed Return
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'fines' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4" id="library-fines-tab">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">Library Overdue Warnings & Fines</h3>

          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Book Borrowed</th>
                  <th className="py-3 px-3">Due Date Deadline</th>
                  <th className="py-3 px-3">Fines Accumulated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {checkouts.filter(co => co.fineAmount > 0).map(co => (
                  <tr key={co.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{co.studentName}</span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {co.studentId}</span>
                    </td>
                    <td className="py-3 px-3">{co.bookTitle}</td>
                    <td className="py-3 px-3 font-mono text-rose-500">{co.dueDate}</td>
                    <td className="py-3 px-3 text-rose-600 font-mono font-bold">
                      SLL {co.fineAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleWaiveFine(co.id)}
                        className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Waive Fine
                      </button>
                    </td>
                  </tr>
                ))}

                {checkouts.filter(co => co.fineAmount > 0).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Award className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                      <p className="text-xs font-semibold">Perfect standing! No overdue warnings or outstanding fines logged.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BOOK */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Book className="w-5 h-5 text-indigo-600" /> {editingBook ? 'Edit Book Details' : 'Catalog Book in Registry'}
              </h3>
              <button 
                onClick={() => setIsBookModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Book Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. WASSCE Integrated Science Core"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Author Name(s)</label>
                <input
                  type="text"
                  required
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  placeholder="e.g. Wellesley Cole"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ISBN Barcode</label>
                  <input
                    type="text"
                    required
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    placeholder="e.g. 978-9991-04"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Resource Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 bg-white cursor-pointer"
                  >
                    <option value="General">General Reading</option>
                    <option value="Science">Science Core</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Literature">Literature</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Physics">Physics</option>
                    <option value="History">History</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Physical Copies Total</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formTotalCopies}
                  onChange={(e) => setFormTotalCopies(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-mono font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Book Details
                </button>
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHECK OUT / ISSUE PHYSICAL BOOK */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <UserCheck className="w-5 h-5 text-indigo-600" /> Issue Physical Book Pass
              </h3>
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Catalogued Book</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 bg-white cursor-pointer font-semibold"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                      {b.title} ({b.availableCopies} left)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recipient Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 bg-white cursor-pointer font-semibold"
                >
                  {students.filter(s => s.status === 'Active').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.currentClass})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Return Deadline Due Date</label>
                <input
                  type="date"
                  required
                  value={checkoutDueDate}
                  onChange={(e) => setCheckoutDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Confirm Issue Pass
                </button>
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Book */}
      {bookToDelete && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBookToDelete(null);
          }}
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Book from Catalog?</h3>
                <p className="text-xs text-slate-500">Remove textbook/novel from library inventory.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
              <p className="font-bold text-slate-900">{bookToDelete.title}</p>
              <p className="text-slate-600">Author: {bookToDelete.author}</p>
              <p className="text-slate-500 font-mono text-[11px]">ISBN: {bookToDelete.isbn} • Category: {bookToDelete.category}</p>
              <p className="text-slate-500 text-[11px]">Total Copies: {bookToDelete.totalCopies}</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Removing this book archives its acquisition entry in the <strong>Institutional Reference Ledger</strong>.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBookDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Waive Overdue Fine */}
      {checkoutToWaive && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCheckoutToWaive(null);
          }}
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Waive Overdue Fine?</h3>
                <p className="text-xs text-slate-500">Pardon late return fee for student.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
              <p className="font-bold text-slate-900">{checkoutToWaive.studentName} ({checkoutToWaive.studentClass})</p>
              <p className="text-slate-600">Book: {checkoutToWaive.bookTitle}</p>
              <p className="text-rose-600 font-bold">Outstanding Fine: SLL {checkoutToWaive.fineAmount.toLocaleString()}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCheckoutToWaive(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmWaiveFine}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Waive Fee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
