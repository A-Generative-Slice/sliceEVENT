import React, { useState } from 'react';
import {
  EventItem,
  VendorBooking,
  StallSeries,
  StallSeriesConfig,
  PaymentMode,
  StallCategory,
  PaymentStatus,
  PaymentTransaction,
} from '../types';
import { calculatePaymentStatus, formatDatePretty, getStallPrefix } from '../lib/storage';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  User,
  Store,
  Calendar,
  Tag,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Layers,
  X,
  CreditCard,
  QrCode,
  Sparkles,
  Receipt,
  MessageSquare,
  ChevronRight,
  Info,
  Clock,
  Check,
  History,
} from 'lucide-react';

interface SeriesStallsViewProps {
  event: EventItem;
  seriesConfig?: StallSeriesConfig;
  series?: StallSeries; // for backwards compatibility
  bookings: VendorBooking[];
  onSaveBooking: (bookingData: Omit<VendorBooking, 'id' | 'createdAt'>, existingId?: string) => void;
  onDeleteBooking: (bookingId: string) => void;
  onBack: () => void;
}

const STALL_CATEGORIES: StallCategory[] = [
  'Clothing & Apparel',
  'Jewelry & Accessories',
  'Footwear & Bags',
  'Artisan & Handicrafts',
  'Home Decor',
  'Beauty & Cosmetics',
  'Gourmet Food & Beverages',
  'Electronics & Gadgets',
  'Other',
];

const PAYMENT_MODES: PaymentMode[] = [
  'UPI / QR Code',
  'Cash',
  'Bank Transfer',
  'Card',
];

export const SeriesStallsView: React.FC<SeriesStallsViewProps> = ({
  event,
  seriesConfig,
  series,
  bookings,
  onSaveBooking,
  onDeleteBooking,
  onBack,
}) => {
  // Derive active series configuration
  const config: StallSeriesConfig = seriesConfig || {
    id: series || 'F',
    name: series === 'S' ? 'S Series' : 'F Series',
    limit: series === 'S' ? event.sSeriesLimit : event.fSeriesLimit,
  };

  const prefix = getStallPrefix(config.name);
  const limit = config.limit;
  const isF = prefix === 'F';

  // Filter bookings for this event and this specific category/series
  const seriesBookings = bookings.filter((b) => {
    if (b.eventId !== event.id) return false;
    if (b.series === config.id || b.series === config.name) return true;
    if (b.stallNumber && b.stallNumber.toUpperCase().startsWith(`${prefix}-`)) return true;
    return false;
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal State for Add or Edit Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<VendorBooking | null>(null);

  // Modal State for Viewing Detailed Stall Information & Payment Logs
  const [viewingBookingDetails, setViewingBookingDetails] = useState<VendorBooking | null>(null);

  // Record Additional Payment State (Inside Stall Details Modal)
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number | ''>('');
  const [newPaymentMode, setNewPaymentMode] = useState<PaymentMode>('UPI / QR Code');
  const [newPaymentDate, setNewPaymentDate] = useState('');
  const [newPaymentNote, setNewPaymentNote] = useState('');

  // Form Fields (Empty defaults for clean entry)
  const [exhibitorName, setExhibitorName] = useState('');
  const [stallName, setStallName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [stallNumber, setStallNumber] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [stallCategory, setStallCategory] = useState<string>('Clothing & Apparel');
  const [stallRent, setStallRent] = useState<number | ''>('');
  const [stallAdvance, setStallAdvance] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI / QR Code');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Auto calculate remaining balance & calculated status dynamically
  const rentVal = typeof stallRent === 'number' ? stallRent : 0;
  const advanceVal = typeof stallAdvance === 'number' ? stallAdvance : 0;
  const { remaining: calculatedRemaining, status: calculatedStatus } =
    calculatePaymentStatus(rentVal, advanceVal);

  const openAddModal = () => {
    setEditingBooking(null);
    setExhibitorName('');
    setStallName('');
    setMobileNumber('');

    // Pre-fill stall number digit only (e.g. "01", "02")
    const nextNum = (seriesBookings.length + 1).toString().padStart(2, '0');
    setStallNumber(nextNum);

    setBookingDate(new Date().toISOString().split('T')[0]);
    setStallCategory('Clothing & Apparel');
    setStallRent(''); // Completely empty fill box
    setStallAdvance(''); // Completely empty fill box
    setPaymentMode('UPI / QR Code');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (booking: VendorBooking) => {
    setEditingBooking(booking);
    setExhibitorName(booking.exhibitorName);
    setStallName(booking.stallName);
    setMobileNumber(booking.mobileNumber);

    // Strip series prefix (e.g. "FOOD-02" -> "02") for clean numeric edit input
    const numPart = booking.stallNumber.replace(new RegExp(`^${prefix}-`, 'i'), '');
    setStallNumber(numPart || booking.stallNumber);

    setBookingDate(booking.bookingDate);
    setStallCategory(booking.stallCategory);
    setStallRent(booking.stallRent);
    setStallAdvance(booking.stallAdvance);
    setPaymentMode(booking.paymentMode);
    setNotes(booking.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenRecordPayment = (booking: VendorBooking) => {
    setNewPaymentAmount(booking.remainingBalance > 0 ? booking.remainingBalance : '');
    setNewPaymentMode(booking.paymentMode || 'UPI / QR Code');
    setNewPaymentDate(new Date().toISOString().split('T')[0]);
    setNewPaymentNote('');
    setIsRecordPaymentOpen(true);
  };

  const handleSaveRecordPayment = () => {
    if (!viewingBookingDetails) return;
    const amt = typeof newPaymentAmount === 'number' ? newPaymentAmount : 0;
    if (amt <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }

    const newTx: PaymentTransaction = {
      id: Date.now().toString(),
      amount: amt,
      paymentMode: newPaymentMode,
      date: newPaymentDate || new Date().toISOString().split('T')[0],
      note: newPaymentNote.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedAdvance = (viewingBookingDetails.stallAdvance || 0) + amt;
    const { remaining: updatedRemaining, status: updatedStatus } =
      calculatePaymentStatus(viewingBookingDetails.stallRent, updatedAdvance);

    const updatedLogs = [...(viewingBookingDetails.paymentLogs || []), newTx];

    const updatedBooking: VendorBooking = {
      ...viewingBookingDetails,
      stallAdvance: updatedAdvance,
      remainingBalance: updatedRemaining,
      calculatedStatus: updatedStatus,
      paymentLogs: updatedLogs,
    };

    // Save upstream
    onSaveBooking(updatedBooking, viewingBookingDetails.id);

    // Update live viewing state & close inline form
    setViewingBookingDetails(updatedBooking);
    setIsRecordPaymentOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhibitorName.trim()) {
      setFormError('Exhibitor Name is required.');
      return;
    }
    if (!stallName.trim()) {
      setFormError('Stall Name is required.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setFormError('Please enter a valid 10-digit Mobile Number.');
      return;
    }
    if (!stallNumber.trim()) {
      setFormError('Stall Number is required.');
      return;
    }

    // Format full stall number with dynamic category prefix (e.g. "FOOD-02")
    let rawNum = stallNumber.trim();
    let formattedStallNum = rawNum;
    if (!rawNum.toUpperCase().startsWith(`${prefix}-`)) {
      const numOnly = rawNum.replace(/\D/g, '');
      const padded = numOnly ? numOnly.padStart(2, '0') : rawNum;
      formattedStallNum = `${prefix}-${padded}`;
    } else {
      formattedStallNum = rawNum.toUpperCase();
    }

    // Check duplicate stall number in this event
    const duplicate = bookings.find(
      (b) =>
        b.eventId === event.id &&
        b.stallNumber.toLowerCase() === formattedStallNum.toLowerCase() &&
        b.id !== editingBooking?.id
    );

    if (duplicate) {
      setFormError(`Stall number "${formattedStallNum}" is already booked for ${duplicate.exhibitorName}!`);
      return;
    }

    onSaveBooking(
      {
        eventId: event.id,
        series: config.id,
        exhibitorName: exhibitorName.trim(),
        stallName: stallName.trim(),
        mobileNumber: mobileNumber.trim(),
        stallNumber: formattedStallNum,
        bookingDate,
        stallCategory,
        stallRent: rentVal,
        stallAdvance: advanceVal,
        remainingBalance: calculatedRemaining,
        paymentMode,
        calculatedStatus,
        notes,
        paymentLogs: editingBooking?.paymentLogs || [],
      },
      editingBooking?.id
    );

    setIsModalOpen(false);
  };

  // Filter vendor list
  const filteredBookings = seriesBookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.exhibitorName.toLowerCase().includes(q) ||
      b.stallName.toLowerCase().includes(q) ||
      b.stallNumber.toLowerCase().includes(q) ||
      b.mobileNumber.includes(q) ||
      b.stallCategory.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'All' || b.calculatedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Series Quick Stats
  let seriesRentTotal = 0;
  let seriesAdvanceTotal = 0;
  let seriesPendingTotal = 0;

  seriesBookings.forEach((b) => {
    seriesRentTotal += b.stallRent || 0;
    seriesAdvanceTotal += b.stallAdvance || 0;
    seriesPendingTotal += b.remainingBalance || 0;
  });

  return (
    <div className="flex flex-col gap-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-[#ffffff] border border-[#ffe0cc] flex items-center justify-center text-[#C2500A] shadow-xs active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold text-white uppercase bg-[#C2500A]">
                {config.name} ({prefix})
              </span>
              <h1 className="text-base font-bold text-[#C2500A]">{event.name}</h1>
            </div>
            <p className="text-xs text-[#7c6354] mt-0.5">
              {seriesBookings.length} of {limit} Stalls Allocated
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="p-2.5 rounded-xl text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1 bg-[#C2500A] hover:bg-[#a8400a]"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Stall
        </button>
      </div>

      {/* Series Financial Summary Strip */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#ffe0cc] p-3.5 shadow-2xs grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="text-[10px] text-[#7c6354] font-bold uppercase block">
            Stalls
          </span>
          <span className="text-xs font-extrabold text-[#C2500A]">
            {seriesBookings.length} / {limit}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#7c6354] font-bold uppercase block">
            Collected
          </span>
          <span className="text-xs font-extrabold text-emerald-700">
            ₹{seriesAdvanceTotal.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#7c6354] font-bold uppercase block">
            Pending
          </span>
          <span className="text-xs font-extrabold text-amber-700">
            ₹{seriesPendingTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search Bar & Status Filter */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <label htmlFor="search-bookings-input" className="text-[11px] font-extrabold uppercase tracking-wider text-[#C2500A]">
            Filter Bookings by Exhibitor Name or Stall No.
          </label>
          {searchQuery && (
            <span className="text-[10px] font-bold text-[#E8621A] bg-[#fff5ee] px-2 py-0.5 rounded-md">
              {filteredBookings.length} of {seriesBookings.length} Found
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#7c6354] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-bookings-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by exhibitor name, stall number (e.g. ${prefix}-01), stall name...`}
            className="w-full pl-10 pr-9 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A] shadow-2xs placeholder:text-[#a599a2]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#ffe0cc] text-[#C2500A] hover:bg-[#f5c9a8] flex items-center justify-center transition-colors"
              title="Clear search filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['All', 'Paid', 'Partial', 'Unpaid'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-[#C2500A] text-white shadow-xs'
                  : 'bg-[#ffffff] text-[#7c6354] border border-[#ffe0cc] hover:bg-[#fff5ee]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor List Cards (Clicking card opens Stall Details & Payment Log Modal) */}
      <div className="flex flex-col gap-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-[#ffffff] p-8 text-center rounded-2xl border border-[#ffe0cc] text-[#7c6354] space-y-3">
            <p className="font-bold text-sm text-[#C2500A]">No Vendor Bookings Found</p>
            <p className="text-xs">
              {searchQuery
                ? `No booking matching exhibitor name or stall number "${searchQuery}" in ${config.name}.`
                : `No stalls allocated in ${config.name} yet. Click "Add Stall" above.`}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-[#fff5ee] text-[#C2500A] border border-[#f5c9a8] text-xs font-bold rounded-xl active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Clear Search Filter
              </button>
            ) : (
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-[#C2500A] text-white text-xs font-bold rounded-xl active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add First Vendor
              </button>
            )}
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div
              key={b.id}
              onClick={() => {
                setViewingBookingDetails(b);
                setIsRecordPaymentOpen(false);
              }}
              className="bg-[#ffffff] rounded-2xl border border-[#ffe0cc] p-4 shadow-2xs hover:shadow-md hover:border-[#E8621A]/50 transition-all space-y-3 cursor-pointer group"
            >
              {/* Header with Stall Number and Payment Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#C2500A] text-white font-black text-xs tracking-wider">
                      {b.stallNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-[#7c6354] bg-[#fff5ee] px-2 py-0.5 rounded-md">
                      {b.stallCategory}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-[#1c1612] leading-tight group-hover:text-[#C2500A] transition-colors">
                    {b.stallName}
                  </h3>
                  <p className="text-xs text-[#4a3b30] font-medium flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#E8621A]" /> {b.exhibitorName}
                  </p>
                </div>

                {/* Status Badge */}
                <div
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                    b.calculatedStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : b.calculatedStatus === 'Partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {b.calculatedStatus === 'Paid' && <CheckCircle className="w-3 h-3" />}
                  {b.calculatedStatus === 'Partial' && <AlertTriangle className="w-3 h-3" />}
                  {b.calculatedStatus === 'Unpaid' && <XCircle className="w-3 h-3" />}
                  <span>{b.calculatedStatus}</span>
                </div>
              </div>

              {/* Contact & Booking Date */}
              <div className="grid grid-cols-2 gap-2 text-xs text-[#4a3b30] bg-[#fff5ee]/70 p-2.5 rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-[#C2500A]">
                  <Phone className="w-3.5 h-3.5 text-[#E8621A]" />
                  <span>{b.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#7c6354] justify-end">
                  <Calendar className="w-3.5 h-3.5 text-[#E8621A]" />
                  <span>{formatDatePretty(b.bookingDate)}</span>
                </div>
              </div>

              {/* Financial Rent Summary */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-[#fff0e6]">
                <div>
                  <span className="text-[10px] text-[#7c6354] font-bold uppercase block">
                    Stall Rent
                  </span>
                  <span className="font-extrabold text-[#C2500A]">
                    ₹{b.stallRent.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                    Collected
                  </span>
                  <span className="font-extrabold text-emerald-700">
                    ₹{b.stallAdvance.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">
                    Remaining
                  </span>
                  <span className="font-extrabold text-amber-700">
                    ₹{b.remainingBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Tap to View Details Footer Badge */}
              <div className="flex items-center justify-between pt-1 border-t border-[#fff0e6] text-[11px] text-[#E8621A] font-extrabold">
                <div className="flex items-center gap-1 text-[#7c6354] font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-[#E8621A]" />
                  <span>{b.paymentMode}</span>
                </div>
                <div className="flex items-center gap-1 text-[#C2500A] font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>View Details & Log Payment</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAILED STALL INFORMATION & PAYMENT LOG MODAL */}
      {viewingBookingDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#ffffff] rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col border border-[#ffe0cc] shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 bg-[#C2500A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#ffb347] text-[#C2500A] font-black text-xs uppercase tracking-wider">
                  STALL {viewingBookingDetails.stallNumber}
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-white leading-tight">
                    {viewingBookingDetails.stallName}
                  </h3>
                  <p className="text-[11px] text-[#ffb347]">{viewingBookingDetails.exhibitorName}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingBookingDetails(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Exhibitor Details Card */}
              <div className="bg-[#fff5ee] rounded-xl p-3.5 space-y-2 border border-[#f5c9a8]/40">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#E8621A]" /> Exhibitor Contact Info
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#7c6354] block">Category</span>
                    <span className="font-extrabold text-[#1c1612]">{viewingBookingDetails.stallCategory}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7c6354] block">Booking Date</span>
                    <span className="font-extrabold text-[#1c1612]">{formatDatePretty(viewingBookingDetails.bookingDate)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f5c9a8]/40 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#C2500A]">
                    <Phone className="w-3.5 h-3.5 text-[#E8621A]" />
                    <span>{viewingBookingDetails.mobileNumber}</span>
                  </div>
                  <a
                    href={`tel:${viewingBookingDetails.mobileNumber}`}
                    className="px-3 py-1 bg-[#C2500A] text-white text-[11px] font-bold rounded-lg hover:bg-[#a8400a] active:scale-95 transition-all"
                  >
                    Call Exhibitor
                  </a>
                </div>
              </div>

              {/* Payment Breakdown & Add Payment Log Box */}
              <div className="bg-[#ffffff] rounded-xl p-3.5 space-y-3 border border-[#ffe0cc] shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#E8621A]" /> Payment Breakdown
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      viewingBookingDetails.calculatedStatus === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : viewingBookingDetails.calculatedStatus === 'Partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {viewingBookingDetails.calculatedStatus}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#fff0e6]">
                    <span className="text-[#7c6354] font-medium">Total Agreed Rent:</span>
                    <span className="font-extrabold text-[#C2500A] text-sm">
                      ₹{viewingBookingDetails.stallRent.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-[#fff0e6]">
                    <span className="text-emerald-800 font-medium">Total Amount Collected:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      ₹{viewingBookingDetails.stallAdvance.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-[#fff0e6]">
                    <span className="text-amber-800 font-medium">Remaining Pending Balance:</span>
                    <span className="font-extrabold text-amber-700 text-sm">
                      ₹{viewingBookingDetails.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* RECORD NEW PAYMENT BUTTON OR INLINE FORM */}
                {viewingBookingDetails.remainingBalance > 0 ? (
                  !isRecordPaymentOpen ? (
                    <button
                      onClick={() => handleOpenRecordPayment(viewingBookingDetails)}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" /> Record Remaining Payment (₹{viewingBookingDetails.remainingBalance.toLocaleString()} Due)
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 mt-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase text-emerald-900 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-700" /> Record Payment Entry
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsRecordPaymentOpen(false)}
                          className="text-xs font-bold text-emerald-800 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-emerald-900">
                            Amount Paid (₹) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={viewingBookingDetails.remainingBalance}
                            value={newPaymentAmount}
                            onChange={(e) =>
                              setNewPaymentAmount(
                                e.target.value === '' ? '' : Number(e.target.value)
                              )
                            }
                            placeholder="Amount"
                            className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900 text-xs focus:outline-hidden focus:border-emerald-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-emerald-900">
                            Payment Date
                          </label>
                          <input
                            type="date"
                            value={newPaymentDate}
                            onChange={(e) => setNewPaymentDate(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-emerald-900">
                          Payment Mode
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PAYMENT_MODES.map((mode) => (
                            <button
                              type="button"
                              key={mode}
                              onClick={() => setNewPaymentMode(mode)}
                              className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                                newPaymentMode === mode
                                  ? 'bg-emerald-700 text-white border-emerald-700'
                                  : 'bg-white text-emerald-900 border-emerald-200'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-emerald-900">
                          Notes / Reference No. (Optional)
                        </label>
                        <input
                          type="text"
                          value={newPaymentNote}
                          onChange={(e) => setNewPaymentNote(e.target.value)}
                          placeholder="e.g. Final settlement via PhonePe"
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-emerald-900 focus:outline-hidden"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveRecordPayment}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-lg shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> Save Payment Log
                      </button>
                    </div>
                  )
                ) : (
                  <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-extrabold text-center flex items-center justify-center gap-1.5 mt-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>STALL RENT SETTLED IN FULL</span>
                  </div>
                )}

                {/* Audit Log Timeline */}
                <div className="p-3 bg-[#fff5ee] rounded-xl border border-[#ffe0cc] text-[11px] text-[#4a3b30] space-y-2 mt-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#C2500A] border-b border-[#ffe0cc] pb-1">
                    <History className="w-3.5 h-3.5 text-[#E8621A]" />
                    <span>Payment Audit Trail & Transaction Logs</span>
                  </div>

                  {/* Initial Booking Log */}
                  <div className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C2500A] mt-1 shrink-0"></span>
                    <div>
                      <p className="font-bold text-[#1c1612]">
                        Initial Deposit Recorded: <span className="text-emerald-700">₹{(viewingBookingDetails.paymentLogs && viewingBookingDetails.paymentLogs.length > 0 ? (viewingBookingDetails.stallAdvance - viewingBookingDetails.paymentLogs.reduce((acc, l) => acc + l.amount, 0)) : viewingBookingDetails.stallAdvance).toLocaleString()}</span>
                      </p>
                      <p className="text-[10px] text-[#7c6354]">
                        {formatDatePretty(viewingBookingDetails.bookingDate)} via {viewingBookingDetails.paymentMode}
                      </p>
                    </div>
                  </div>

                  {/* Additional Recorded Payment Logs */}
                  {viewingBookingDetails.paymentLogs && viewingBookingDetails.paymentLogs.map((tx, idx) => (
                    <div key={tx.id || idx} className="flex items-start gap-1.5 pt-1 border-t border-[#ffe0cc]/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1 shrink-0"></span>
                      <div>
                        <p className="font-bold text-emerald-800">
                          Payment Received: <span className="font-black">+₹{tx.amount.toLocaleString()}</span> ({tx.paymentMode})
                        </p>
                        <p className="text-[10px] text-[#7c6354]">
                          Recorded on {formatDatePretty(tx.date)} {tx.note ? `• Ref: ${tx.note}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewingBookingDetails.notes && (
                <div className="p-3 bg-[#fffbf7] rounded-xl border border-[#ffe0cc] space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-[#7c6354]">Internal Notes:</span>
                  <p className="text-xs text-[#1c1612] italic">{viewingBookingDetails.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer: Edit & Delete Buttons Inside */}
            <div className="p-3 bg-[#fffbf7] border-t border-[#ffe0cc] grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const target = viewingBookingDetails;
                  setViewingBookingDetails(null);
                  openEditModal(target);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#fff5ee] border border-[#f5c9a8] text-[#C2500A] hover:bg-[#ffe0cc] active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-2xs"
              >
                <Edit2 className="w-4 h-4 text-[#E8621A]" /> Edit Booking
              </button>

              <button
                onClick={() => {
                  const id = viewingBookingDetails.id;
                  setViewingBookingDetails(null);
                  onDeleteBooking(id);
                }}
                className="py-2.5 px-3 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-2xs"
              >
                <Trash2 className="w-4 h-4" /> Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT VENDOR FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#ffffff] rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col border border-[#ffe0cc] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#fffbf7] border-b border-[#ffe0cc] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#C2500A]">
                  {editingBooking ? 'Edit Vendor Details' : `Add New ${config.name} Vendor`}
                </h3>
                <p className="text-xs text-[#7c6354]">
                  Stall allocation and rental payment details ({prefix} Series)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#ffe0cc] text-[#C2500A] flex items-center justify-center font-bold hover:bg-[#f5c9a8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleSubmit}
              className="p-4 overflow-y-auto flex-1 space-y-3 text-xs"
            >
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs">
                  {formError}
                </div>
              )}

              {/* 1. Exhibitor Name (Clean Label) */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-[#C2500A]">
                  Exhibitor Name *
                </label>
                <input
                  type="text"
                  value={exhibitorName}
                  onChange={(e) => setExhibitorName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full px-3 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A]"
                />
              </div>

              {/* 2. Stall Name (Clean Label) */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-[#C2500A]">
                  Stall Name *
                </label>
                <input
                  type="text"
                  value={stallName}
                  onChange={(e) => setStallName(e.target.value)}
                  placeholder="e.g. Classic Threads"
                  required
                  className="w-full px-3 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A]"
                />
              </div>

              {/* 3. Mobile Number & Stall Number (Numeric-Only with {prefix}- Prefix) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[#C2500A]">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 9876543210"
                    required
                    className="w-full px-3 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[#C2500A]">
                    Stall Number *
                  </label>
                  <div className="flex items-center rounded-xl border border-[#f5c9a8] bg-[#ffffff] overflow-hidden focus-within:border-[#C2500A]">
                    <span className="px-2.5 py-2.5 font-extrabold text-[#C2500A] text-xs bg-[#fff5ee] border-r border-[#f5c9a8] shrink-0 select-none">
                      {prefix}-
                    </span>
                    <input
                      type="text"
                      value={stallNumber}
                      onChange={(e) => setStallNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="01"
                      required
                      className="w-full px-2.5 py-2.5 bg-transparent text-xs font-black text-[#C2500A] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Booking Date & Stall Category */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[#C2500A]">
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[#C2500A]">
                    Stall Category
                  </label>
                  <select
                    value={stallCategory}
                    onChange={(e) => setStallCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A]"
                  >
                    {STALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Stall Rent & Stall Cost Advance (Clean Labels & Empty Fill Boxes) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[#C2500A]">
                    Stall Rent (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stallRent}
                    onChange={(e) =>
                      setStallRent(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Enter rent amount"
                    required
                    className="w-full px-3 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-bold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-emerald-800">
                    Stall Cost Advance (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stallAdvance}
                    onChange={(e) =>
                      setStallAdvance(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Enter advance paid"
                    className="w-full px-3 py-2.5 bg-[#ffffff] border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* AUTOMATICALLY CALCULATED REMAINING BALANCE & CALCULATED STATUS */}
              <div className="bg-[#fff5ee] border border-[#f5c9a8] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#7c6354] uppercase">
                    Remaining Balance:
                  </span>
                  <span className="font-black text-sm text-[#C2500A]">
                    ₹{calculatedRemaining.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#7c6354] uppercase">
                    Calculated Status:
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full font-black text-xs uppercase ${
                      calculatedStatus === 'Paid'
                        ? 'bg-emerald-200 text-emerald-900'
                        : calculatedStatus === 'Partial'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {calculatedStatus}
                  </span>
                </div>
              </div>

              {/* 6. Payment Mode */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-[#C2500A]">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_MODES.map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        paymentMode === mode
                          ? 'bg-[#C2500A] text-white border-[#C2500A]'
                          : 'bg-[#ffffff] text-[#4a3b30] border-[#f5c9a8] hover:bg-[#fff5ee]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="mt-4 w-full py-3 bg-gradient-to-r from-[#C2500A] to-[#a8400a] text-white font-bold text-xs rounded-xl shadow-md active:scale-98 transition-all"
              >
                {editingBooking ? 'Update Vendor Booking' : 'Save Vendor Stall Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
