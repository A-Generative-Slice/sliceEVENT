import React, { useState } from 'react';
import { EventItem, StallSeriesConfig } from '../types';
import { DEFAULT_LAYOUT_IMAGE } from '../lib/storage';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Upload,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';

interface CreateEventViewProps {
  initialEvent?: EventItem | null;
  onSave: (eventData: Omit<EventItem, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  onBack: () => void;
}

function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mStr = m.toString().padStart(2, '0');
  return `${h12.toString().padStart(2, '0')}:${mStr} ${period}`;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Derive initial stall series configs from event (supports legacy F/S and new dynamic) */
function getInitialConfigs(event?: EventItem | null): StallSeriesConfig[] {
  if (event?.stallSeriesConfigs && event.stallSeriesConfigs.length > 0) {
    return event.stallSeriesConfigs;
  }
  if (event) {
    // Legacy event: seed two configs from F/S limits
    return [
      { id: genId(), name: 'F Series', limit: event.fSeriesLimit || 100 },
      { id: genId(), name: 'S Series', limit: event.sSeriesLimit || 20 },
    ];
  }
  // New event: start empty
  return [];
}

export const CreateEventView: React.FC<CreateEventViewProps> = ({
  initialEvent,
  onSave,
  onBack,
}) => {
  const [name, setName] = useState(initialEvent?.name || '');
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [startDate, setStartDate] = useState(initialEvent?.startDate || '');
  const [endDate, setEndDate] = useState(initialEvent?.endDate || '');

  const [startTime, setStartTime] = useState(initialEvent?.timing ? '10:00' : '');
  const [endTime, setEndTime] = useState(initialEvent?.timing ? '21:00' : '');

  const [mapLocation, setMapLocation] = useState(initialEvent?.mapLocation || '');

  // Dynamic stall category configs
  const [stallConfigs, setStallConfigs] = useState<StallSeriesConfig[]>(
    getInitialConfigs(initialEvent)
  );

  // Layout Image
  const [layoutImageUrl, setLayoutImageUrl] = useState<string>(
    initialEvent?.layoutImageUrl || DEFAULT_LAYOUT_IMAGE
  );
  const [imageFileName, setImageFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('image')) {
        setErrorMsg('Please select a valid image file (PNG, JPG, SVG, WebP).');
        return;
      }
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setLayoutImageUrl(uploadEvent.target.result as string);
          setErrorMsg('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Stall config handlers ---
  const addStallCategory = () => {
    setStallConfigs((prev) => [
      ...prev,
      { id: genId(), name: '', limit: 50 },
    ]);
  };

  const updateStallConfig = (id: string, field: 'name' | 'limit', value: string | number) => {
    setStallConfigs((prev) =>
      prev.map((cfg) => (cfg.id === id ? { ...cfg, [field]: value } : cfg))
    );
  };

  const removeStallConfig = (id: string) => {
    setStallConfigs((prev) => prev.filter((cfg) => cfg.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter the Event Name.');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Please enter the Location.');
      return;
    }
    if (stallConfigs.length === 0) {
      setErrorMsg('Please add at least one Stall Category.');
      return;
    }
    for (const cfg of stallConfigs) {
      if (!cfg.name.trim()) {
        setErrorMsg('Please give every stall category a name.');
        return;
      }
      if (!cfg.limit || cfg.limit < 1) {
        setErrorMsg(`Stall count for "${cfg.name || 'a category'}" must be at least 1.`);
        return;
      }
    }

    let timingString = '';
    if (startTime && endTime) {
      timingString = `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`;
    } else if (startTime) {
      timingString = `From ${formatTime12h(startTime)}`;
    }

    // Compute legacy F/S fields from first two configs (or 0 if dynamic)
    const fLegacy = stallConfigs[0] ? Number(stallConfigs[0].limit) : 0;
    const sLegacy = stallConfigs[1] ? Number(stallConfigs[1].limit) : 0;

    onSave(
      {
        name: name.trim(),
        location: location.trim(),
        startDate,
        endDate,
        timing: timingString,
        mapLocation: mapLocation.trim(),
        fSeriesLimit: fLegacy,
        sSeriesLimit: sLegacy,
        stallSeriesConfigs: stallConfigs.map((cfg) => ({
          ...cfg,
          name: cfg.name.trim(),
          limit: Number(cfg.limit) || 1,
        })),
        layoutImageUrl: layoutImageUrl || DEFAULT_LAYOUT_IMAGE,
        bannerImageUrl: layoutImageUrl || DEFAULT_LAYOUT_IMAGE,
        isCompleted: initialEvent?.isCompleted || false,
      },
      initialEvent?.id
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-16 w-full max-w-2xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-[#ffffff] border border-[#ffe0cc] flex items-center justify-center text-[#C2500A] shadow-xs active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#E8621A]">
          {initialEvent ? 'Edit Exhibition Event' : 'Create New Event'}
        </span>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-[#ffffff] rounded-2xl border border-[#ffe0cc] p-5 shadow-xs">

        {/* Event Name */}
        <div className="space-y-1.5">
          <label htmlFor="event-name-input" className="text-xs font-bold uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#E8621A]" /> Event Name
          </label>
          <input
            id="event-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Autumn Pop-Up Market 2026"
            className="w-full px-4 py-3 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-sm font-medium text-[#1c1612] focus:outline-hidden focus:border-[#C2500A] shadow-2xs"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label htmlFor="location-input" className="text-xs font-bold uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#E8621A]" /> Location / Venue
          </label>
          <input
            id="location-input"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Hotel Taj Ballroom, Mumbai"
            className="w-full px-4 py-3 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-sm font-medium text-[#1c1612] focus:outline-hidden focus:border-[#C2500A] shadow-2xs"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#7c6354] uppercase block flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Start Date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A] cursor-pointer shadow-2xs"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#7c6354] uppercase block flex items-center gap-1">
              <Calendar className="w-3 h-3" /> End Date
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A] cursor-pointer shadow-2xs"
            />
          </div>
        </div>

        {/* Timing */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#E8621A]" /> Exhibition Timing
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#7c6354] uppercase block">Opening Time</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A] cursor-pointer shadow-2xs"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#7c6354] uppercase block">Closing Time</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A] cursor-pointer shadow-2xs"
              />
            </div>
          </div>
          {startTime && endTime && (
            <p className="text-[11px] font-bold text-[#C2500A] pt-1">
              Selected Timing: <span className="text-[#E8621A]">{formatTime12h(startTime)} – {formatTime12h(endTime)}</span>
            </p>
          )}
        </div>

        {/* Map Location */}
        <div className="space-y-1.5">
          <label htmlFor="map-location-input" className="text-xs font-bold uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#E8621A]" /> Map Location (Google Maps Link)
          </label>
          <input
            id="map-location-input"
            type="text"
            value={mapLocation}
            onChange={(e) => setMapLocation(e.target.value)}
            placeholder="e.g. https://maps.google.com/?q=Hotel+Taj+Ballroom"
            className="w-full px-4 py-3 bg-[#ffffff] border border-[#f5c9a8] rounded-xl text-xs font-medium text-[#1c1612] focus:outline-hidden focus:border-[#C2500A] shadow-2xs"
          />
        </div>

        {/* ─── DYNAMIC STALL CATEGORIES ─── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#E8621A]" /> Stall Categories
            </label>
            <span className="text-[10px] text-[#7c6354] font-semibold">
              {stallConfigs.length} {stallConfigs.length === 1 ? 'category' : 'categories'} · {stallConfigs.reduce((s, c) => s + (Number(c.limit) || 0), 0)} total stalls
            </span>
          </div>

          {stallConfigs.length === 0 && (
            <div className="p-4 rounded-xl border border-dashed border-[#f5c9a8] bg-[#fff5ee] text-center text-xs text-[#7c6354] font-medium">
              No stall categories yet. Click <span className="font-bold text-[#C2500A]">+ Add Stall Category</span> below to define your stall zones.
            </div>
          )}

          <div className="flex flex-col gap-2">
            {stallConfigs.map((cfg, idx) => (
              <div
                key={cfg.id}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#fff5ee] border border-[#f5c9a8] group"
              >
                {/* Index badge */}
                <span className="w-6 h-6 rounded-lg bg-[#C2500A] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>

                {/* Category name input */}
                <input
                  type="text"
                  value={cfg.name}
                  onChange={(e) => updateStallConfig(cfg.id, 'name', e.target.value)}
                  placeholder="Category name (e.g. F Series, Premium, Corner)"
                  className="flex-1 min-w-0 px-3 py-2 bg-[#ffffff] border border-[#f5c9a8] rounded-lg text-xs font-semibold text-[#1c1612] focus:outline-hidden focus:border-[#C2500A] shadow-2xs"
                />

                {/* Stall count input */}
                <div className="shrink-0 w-24">
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={cfg.limit}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateStallConfig(cfg.id, 'limit', val === '' ? 1 : parseInt(val, 10) || 1);
                    }}
                    placeholder="Count"
                    className="w-full px-3 py-2 bg-[#ffffff] border border-[#f5c9a8] rounded-lg text-xs font-extrabold text-[#C2500A] text-center focus:outline-hidden focus:border-[#C2500A] shadow-2xs"
                  />
                </div>

                <span className="text-[10px] text-[#7c6354] font-bold shrink-0">stalls</span>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeStallConfig(cfg.id)}
                  className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center shrink-0"
                  title="Remove this category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Category Button */}
          <button
            type="button"
            onClick={addStallCategory}
            className="w-full py-3 border-2 border-dashed border-[#E8621A] text-[#C2500A] font-bold text-sm rounded-xl hover:bg-[#fff0e6] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add Stall Category
          </button>
        </div>

        {/* Layout Plan Upload */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#C2500A] flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#E8621A]" /> Exhibition Layout Plan
          </label>

          <div className="p-5 rounded-2xl bg-[#ffffff] border-2 border-dashed border-[#f5c9a8] hover:border-[#C2500A] transition-all space-y-4 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#fff5ee] text-[#C2500A] flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <label className="px-5 py-2.5 bg-[#C2500A] hover:bg-[#a8400a] text-white text-xs font-bold rounded-xl cursor-pointer shadow-md active:scale-95 transition-all inline-flex items-center gap-2">
                  <span>Upload Layout Plan</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-[#7c6354] font-medium mt-1">
                {imageFileName ? `Selected File: ${imageFileName}` : 'Select a custom layout image or use default floor plan'}
              </p>
            </div>

            <div className="w-full h-48 bg-[#fff0e6] rounded-xl border border-[#ffe0cc] overflow-hidden relative flex items-center justify-center">
              <img
                src={layoutImageUrl}
                alt="Layout Plan Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 right-2 px-3 py-1 bg-black/70 backdrop-blur-md rounded-lg text-white text-[10px] font-bold">
                Layout Floor Plan
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-[#C2500A] to-[#a8400a] hover:from-[#a8400a] hover:to-[#E8621A] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#C2500A]/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
        >
          <Check className="w-5 h-5 text-[#ffb347] stroke-[3]" />
          <span>{initialEvent ? 'Save Event Changes' : 'Create & Launch Event'}</span>
        </button>
      </form>
    </div>
  );
};
