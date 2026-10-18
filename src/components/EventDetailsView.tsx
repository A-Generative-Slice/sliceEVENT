import React, { useState, useRef } from 'react';
import { EventItem, VendorBooking, StallSeriesConfig } from '../types';
import { calculateEventDashboardStats, formatDateRange, getStallPrefix } from '../lib/storage';
import {
  generateVendorBlueprintPDF,
  generateOwnerReportPDF,
  formatStallAvailabilityText,
} from '../lib/pdfGenerator';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
  ExternalLink,
  Layers,
  DollarSign,
  TrendingUp,
  Clock3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Maximize2,
  X,
  RotateCcw,
  Sparkles,
  FileText,
  Download,
  Printer,
  Copy,
} from 'lucide-react';

interface EventDetailsViewProps {
  event: EventItem;
  bookings: VendorBooking[];
  onOpenSeries: (config: StallSeriesConfig) => void;
  onOpenFSeries?: () => void;
  onOpenSSeries?: () => void;
  onEditEvent: () => void;
  onDeleteEvent: () => void;
  onToggleComplete: () => void;
  onBack: () => void;
}

interface TouchZoomableImageViewerProps {
  src: string;
  alt: string;
}

const TouchZoomableImageViewer: React.FC<TouchZoomableImageViewerProps> = ({
  src,
  alt,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });

  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchScaleRef = useRef<number>(1);

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    setPosition({
      x: initialPosRef.current.x + dx,
      y: initialPosRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch Handlers (1-finger drag & 2-finger pinch zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      startPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPosRef.current = { ...position };
      initialPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialPinchDistRef.current = dist;
      initialPinchScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - startPosRef.current.x;
      const dy = e.touches[0].clientY - startPosRef.current.y;
      setPosition({
        x: initialPosRef.current.x + dx,
        y: initialPosRef.current.y + dy,
      });
    } else if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = currentDist / initialPinchDistRef.current;
      const newScale = Math.min(Math.max(initialPinchScaleRef.current * factor, 1), 5);
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistRef.current = null;
    }
    if (e.touches.length === 0) {
      isDraggingRef.current = false;
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 1), 5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Double tap / Double click to reset or toggle zoom
  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      className="w-full h-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none bg-black/60 relative"
    >
      <img
        src={src}
        alt={alt}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.15s ease-out',
        }}
        className="max-w-full max-h-full object-contain pointer-events-none rounded-xl shadow-2xl"
        draggable={false}
      />
      
      {/* Floating gesture guide tag */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white/80 text-[11px] font-semibold pointer-events-none">
        Pinch 2 fingers to zoom • Drag 1 finger to move
      </div>
    </div>
  );
};

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
  event,
  bookings,
  onOpenSeries,
  onOpenFSeries,
  onOpenSSeries,
  onEditEvent,
  onDeleteEvent,
  onToggleComplete,
  onBack,
}) => {
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExportingVendorPdf, setIsExportingVendorPdf] = useState(false);
  const [isExportingOwnerPdf, setIsExportingOwnerPdf] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');
  const [copySuccessMsg, setCopySuccessMsg] = useState('');

  const stats = calculateEventDashboardStats(event, bookings);

  // Dynamic stall categories (fallback to legacy F / S if none exist)
  const seriesConfigs: StallSeriesConfig[] =
    event.stallSeriesConfigs && event.stallSeriesConfigs.length > 0
      ? event.stallSeriesConfigs
      : [
          { id: 'F', name: 'F Series', limit: event.fSeriesLimit || 100 },
          { id: 'S', name: 'S Series', limit: event.sSeriesLimit || 20 },
        ];

  const handleExportVendorPDF = async () => {
    try {
      setIsExportingVendorPdf(true);
      await generateVendorBlueprintPDF(event, bookings);
      setExportSuccessMsg('Vendor Blueprint & Availability PDF generated successfully! (Zero Financial Data)');
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to generate Vendor PDF:', err);
      alert('Could not generate Vendor PDF. Please try again.');
    } finally {
      setIsExportingVendorPdf(false);
    }
  };

  const handleExportOwnerPDF = async () => {
    try {
      setIsExportingOwnerPdf(true);
      await generateOwnerReportPDF(event, bookings);
      setExportSuccessMsg('Owner Executive & Financial Ledger PDF generated successfully!');
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to generate Owner PDF:', err);
      alert('Could not generate Owner PDF. Please try again.');
    } finally {
      setIsExportingOwnerPdf(false);
    }
  };

  const handleCopyAvailabilityInfo = () => {
    try {
      const textToCopy = formatStallAvailabilityText(event, bookings);
      navigator.clipboard.writeText(textToCopy);
      setCopySuccessMsg('Stall Availability Info copied to clipboard! Ready to paste into WhatsApp/Messages.');
      setTimeout(() => setCopySuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to copy availability text:', err);
      alert('Could not copy to clipboard. Please copy manually.');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 w-full max-w-6xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-[#ffffff] border border-[#ffe0cc] flex items-center justify-center text-[#C2500A] shadow-xs active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEditEvent}
            className="p-2.5 rounded-xl bg-[#ffffff] border border-[#f5c9a8] text-[#C2500A] hover:bg-[#fff5ee] active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Edit Event Details"
          >
            <Edit className="w-4 h-4 text-[#E8621A]" /> Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Delete Event"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {copySuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{copySuccessMsg}</span>
        </div>
      )}

      {exportSuccessMsg && (
        <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* Event Header Banner Card */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#ffe0cc] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              event.isCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-[#ffb347] text-[#C2500A]'
            }`}
          >
            {event.isCompleted ? 'COMPLETED EVENT' : 'ACTIVE EXHIBITION'}
          </span>

          <button
            onClick={onToggleComplete}
            className="text-xs font-bold text-[#E8621A] hover:text-[#C2500A] underline flex items-center gap-1"
          >
            {event.isCompleted ? 'Mark as Active' : 'Mark Completed'}
          </button>
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-[#C2500A] leading-tight">
            {event.name}
          </h1>
          <p className="text-xs text-[#4a3b30] flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#E8621A] shrink-0" />
            <span>{event.location}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#fff0e6] text-[#7c6354]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#E8621A]" />
            <span className="font-semibold text-[#1c1612]">
              {formatDateRange(event.startDate, event.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#E8621A]" />
            <span className="font-semibold text-[#1c1612]">{event.timing}</span>
          </div>
        </div>

        {event.mapLocation && (
          <a
            href={
              event.mapLocation.startsWith('http://') || event.mapLocation.startsWith('https://')
                ? event.mapLocation
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.mapLocation)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#C2500A] hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#E8621A]" /> Open Location Map
          </a>
        )}

        {/* 1-Click Action Buttons: Copy Availability Text, Vendor Blueprint PDF, Owner Executive PDF */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          {/* 1-Click Copy Remaining Seats Info Button */}
          <button
            onClick={handleCopyAvailabilityInfo}
            className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md active:scale-98 transition-all"
            title="Copy formatted text to send on WhatsApp"
          >
            <Copy className="w-4 h-4 text-emerald-200" />
            <span>Copy Availability (WhatsApp)</span>
          </button>

          {/* 1-Click Vendor Blueprint & Availability PDF (NO Financials) */}
          <button
            onClick={handleExportVendorPDF}
            disabled={isExportingVendorPdf}
            className="w-full py-3 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md active:scale-98 transition-all"
            title="Export clean Floor Plan & Stall Availability PDF for Vendors (No financial amounts)"
          >
            <FileText className="w-4 h-4 text-indigo-200" />
            <span>
              {isExportingVendorPdf
                ? 'Generating...'
                : 'Vendor Blueprint PDF'}
            </span>
          </button>

          {/* 1-Click Owner Executive & Financial Ledger PDF */}
          <button
            onClick={handleExportOwnerPDF}
            disabled={isExportingOwnerPdf}
            className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-[#C2500A] to-[#a8400a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md active:scale-98 transition-all"
            title="Export full Financial Ledger & Revenue Overview for Event Owner"
          >
            <Download className="w-4 h-4 text-[#ffb347]" />
            <span>
              {isExportingOwnerPdf
                ? 'Generating...'
                : 'Owner Executive PDF'}
            </span>
          </button>
        </div>
      </div>

      {/* DYNAMIC STALL CATEGORY / ZONE CARDS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#E8621A]" /> Manage Stall Categories ({seriesConfigs.length})
          </h2>
          <span className="text-[11px] text-[#7c6354] font-semibold">
            Click to allocate stalls & manage vendors
          </span>
        </div>

        <div
          className={`grid gap-3.5 ${
            seriesConfigs.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {seriesConfigs.map((cfg, idx) => {
            const stat = stats.seriesStats.find((s) => s.name === cfg.name) || {
              name: cfg.name,
              limit: cfg.limit,
              booked: 0,
              available: cfg.limit,
            };
            const prefix = getStallPrefix(cfg.name);
            const isFull = stat.available <= 0;

            const gradients = [
              'from-[#C2500A] to-[#8f3603]',
              'from-[#E8621A] to-[#aa430c]',
              'from-[#9c3d05] to-[#6e2902]',
              'from-[#d95c14] to-[#9c3e07]',
            ];
            const bgGrad = gradients[idx % gradients.length];

            const handleCardClick = () => {
              if (onOpenSeries) {
                onOpenSeries(cfg);
              } else if (cfg.id === 'F' && onOpenFSeries) {
                onOpenFSeries();
              } else if (cfg.id === 'S' && onOpenSSeries) {
                onOpenSSeries();
              }
            };

            return (
              <button
                key={cfg.id || idx}
                onClick={handleCardClick}
                className={`flex flex-col justify-between gap-3 p-4 rounded-2xl bg-gradient-to-br ${bgGrad} text-white shadow-md hover:shadow-lg active:scale-95 transition-all text-left relative overflow-hidden group`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white text-[11px] font-extrabold uppercase tracking-wide truncate">
                    {cfg.name} ({prefix})
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isFull ? 'bg-red-400 text-white' : 'bg-emerald-400/90 text-emerald-950'
                    }`}
                  >
                    {isFull ? 'SOLD OUT' : `${stat.available} VACANT`}
                  </span>
                </div>

                <div>
                  <span className="text-2xl font-black block text-white tracking-tight">
                    {stat.booked}{' '}
                    <span className="text-xs font-semibold text-white/80">
                      / {cfg.limit} Booked
                    </span>
                  </span>
                  <span className="text-[11px] text-white/90 font-medium mt-1 flex items-center justify-between">
                    <span>Manage {prefix} Stalls →</span>
                    <span className="text-[10px] text-white/70">
                      Prefix: {prefix}-01..{String(cfg.limit).padStart(2, '0')}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DASHBOARD LIKE THINGS */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#ffe0cc] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#C2500A] uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#E8621A]" /> Exhibition Dashboard
          </h2>
          <span className="text-xs font-bold text-[#7c6354]">
            {stats.stallsBooked} / {stats.totalStalls} Stalls Occupied
          </span>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-[#fff5ee] p-3 rounded-xl border border-[#f5c9a8]/60">
            <span className="text-[10px] text-[#7c6354] font-bold uppercase block">
              Total Stall
            </span>
            <span className="text-lg font-extrabold text-[#C2500A]">
              {stats.totalStalls}
            </span>
          </div>

          <div className="bg-[#fff5ee] p-3 rounded-xl border border-[#f5c9a8]/60">
            <span className="text-[10px] text-[#7c6354] font-bold uppercase block">
              Stalls Booked
            </span>
            <span className="text-lg font-extrabold text-[#E8621A]">
              {stats.stallsBooked}
            </span>
          </div>

          <div className="bg-[#fff5ee] p-3 rounded-xl border border-[#f5c9a8]/60">
            <span className="text-[10px] text-[#7c6354] font-bold uppercase block">
              Stalls Available
            </span>
            <span className="text-lg font-extrabold text-emerald-700">
              {stats.stallsAvailable}
            </span>
          </div>
        </div>

        {/* Financial Metrics Strip */}
        <div className="pt-2 border-t border-[#fff0e6] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#7c6354] flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#E8621A]" /> Revenue Financial Overview
            </span>
            <span className="text-[#C2500A]">
              Total Value: ₹{stats.totalValue.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                  Advance Collected
                </span>
                <span className="text-base font-extrabold text-emerald-900">
                  ₹{stats.totalCollected.toLocaleString()}
                </span>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-800 font-bold uppercase block">
                  Remaining Pending
                </span>
                <span className="text-base font-extrabold text-amber-900">
                  ₹{stats.totalPending.toLocaleString()}
                </span>
              </div>
              <Clock3 className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          {/* Vendors Payment Status Breakdown Pills */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            {/* Paid Box */}
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-emerald-800 font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Paid
              </div>
              <span className="text-base font-extrabold text-emerald-900">
                {stats.paidCount}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">Fully Settled</span>
            </div>

            {/* Partial Box */}
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-amber-800 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Partial
              </div>
              <span className="text-base font-extrabold text-amber-900">
                {stats.partialCount}
              </span>
              <span className="text-[10px] text-amber-700 font-medium">Balance Pending</span>
            </div>

            {/* Unpaid Box */}
            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-rose-800 font-bold">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Unpaid
              </div>
              <span className="text-base font-extrabold text-rose-900">
                {stats.unpaidCount}
              </span>
              <span className="text-[10px] text-rose-700 font-medium">Due Rent</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW THE LAYOUT FLOOR PLAN */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#ffe0cc] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-[#C2500A] uppercase tracking-wider flex items-center gap-1.5">
            <Maximize2 className="w-4 h-4 text-[#E8621A]" /> Exhibition Layout Plan
          </h2>
          <button
            onClick={() => setIsLayoutModalOpen(true)}
            className="text-xs font-bold text-[#C2500A] hover:underline flex items-center gap-1"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Fullscreen View
          </button>
        </div>

        <div
          onClick={() => setIsLayoutModalOpen(true)}
          className="w-full h-52 bg-[#fff5ee] rounded-xl overflow-hidden border border-[#f5c9a8] relative cursor-pointer group"
        >
          <img
            src={event.layoutImageUrl}
            alt="Event Layout Floor Plan"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
            <Maximize2 className="w-4 h-4" /> Click to view full screen
          </div>
        </div>
      </div>

      {/* CLEAN ORIGINAL FULLSCREEN MODAL WITH NATIVE 2-FINGER PINCH ZOOM & 1-FINGER DRAG */}
      {isLayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#fffbf7] rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col gap-3 relative overflow-hidden shadow-2xl border border-[#ffe0cc] animate-scaleUp">
            {/* Clean Original Header */}
            <div className="px-4 py-3 bg-[#ffffff] border-b border-[#ffe0cc] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#C2500A]">
                  {event.name} - Floor Plan Layout
                </h3>
                <p className="text-[11px] text-[#7c6354]">
                  Pinch 2 fingers to zoom • Drag 1 finger to move
                </p>
              </div>

              <button
                onClick={() => setIsLayoutModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#ffe0cc] text-[#C2500A] hover:bg-[#f5c9a8] flex items-center justify-center font-bold transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gesture-Enabled Zoomable Floor Plan Viewer */}
            <div className="flex-1 bg-[#1c1612] rounded-xl overflow-hidden relative">
              <TouchZoomableImageViewer
                src={event.layoutImageUrl}
                alt={`${event.name} Floor Plan`}
              />
            </div>

            {/* Close Button */}
            <div className="px-4 pb-3">
              <button
                onClick={() => setIsLayoutModalOpen(false)}
                className="w-full py-2.5 bg-[#C2500A] hover:bg-[#a8400a] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs"
              >
                Close Floor Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-2xl p-6 max-w-sm w-full space-y-4 border border-[#ffe0cc] shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-[#1c1612]">Delete Event?</h3>
              <p className="text-xs text-[#7c6354] mt-1">
                Are you sure you want to delete "{event.name}" and all associated stall bookings? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 px-4 bg-[#fff5ee] text-[#C2500A] text-xs font-bold rounded-xl border border-[#f5c9a8]"
              >
                Cancel
              </button>
              <button
                onClick={onDeleteEvent}
                className="py-2.5 px-4 bg-red-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-700"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
