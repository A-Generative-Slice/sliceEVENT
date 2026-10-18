import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventItem, VendorBooking, SupabaseConfig, PaymentStatus } from '../types';

const EVENTS_STORAGE_KEY = 'velvet_trunk_events_v3';
const BOOKINGS_STORAGE_KEY = 'velvet_trunk_bookings_v3';
const SUPABASE_CONFIG_KEY = 'velvet_trunk_supabase_cfg';

// Default layout JPG image (Base64 or high quality luxury stall layout SVG/data URI)
export const DEFAULT_LAYOUT_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="none"><rect width="800" height="600" fill="%23fffbf7"/><rect x="20" y="20" width="760" height="560" rx="16" fill="%23fff0e6" stroke="%23f5c9a8" stroke-width="2" stroke-dasharray="8 8"/><text x="400" y="60" text-anchor="middle" fill="%23c2500a" font-family="sans-serif" font-size="22" font-weight="bold">SLICEEVENT - EXHIBITION FLOOR PLAN</text><rect x="60" y="100" width="680" height="180" rx="12" fill="%23c2500a" fill-opacity="0.08" stroke="%23c2500a" stroke-width="1.5"/><text x="400" y="125" text-anchor="middle" fill="%23c2500a" font-family="sans-serif" font-size="16" font-weight="bold">F-SERIES ZONE (F-01 to F-100) — PREMIUM FRONT PAVILION</text><g fill="%23c2500a" fill-opacity="0.15" stroke="%23c2500a" stroke-width="1"><rect x="80" y="140" width="55" height="40" rx="4"/><text x="107" y="165" text-anchor="middle" fill="%23c2500a" font-size="11" font-weight="bold">F-01</text><rect x="145" y="140" width="55" height="40" rx="4"/><text x="172" y="165" text-anchor="middle" fill="%23c2500a" font-size="11" font-weight="bold">F-02</text><rect x="210" y="140" width="55" height="40" rx="4"/><text x="237" y="165" text-anchor="middle" fill="%23c2500a" font-size="11" font-weight="bold">F-03</text><rect x="275" y="140" width="55" height="40" rx="4"/><text x="302" y="165" text-anchor="middle" fill="%23c2500a" font-size="11" font-weight="bold">F-04</text><rect x="340" y="140" width="55" height="40" rx="4"/><text x="367" y="165" text-anchor="middle" fill="%23c2500a" font-size="11" font-weight="bold">F-05</text></g><rect x="60" y="320" width="680" height="150" rx="12" fill="%23e8621a" fill-opacity="0.08" stroke="%23e8621a" stroke-width="1.5"/><text x="400" y="345" text-anchor="middle" fill="%23e8621a" font-family="sans-serif" font-size="16" font-weight="bold">S-SERIES ZONE (S-01 to S-20) — SELECT VIP LOUNGE</text></svg>`;

export const SAMPLE_EVENTS: EventItem[] = [];

export const SAMPLE_BOOKINGS: VendorBooking[] = [];

// Calculation helper for vendor payment status
export function calculatePaymentStatus(rent: number, advance: number): {
  remaining: number;
  status: PaymentStatus;
} {
  const safeRent = Math.max(0, rent || 0);
  const safeAdvance = Math.max(0, advance || 0);
  const remaining = Math.max(0, safeRent - safeAdvance);

  let status: PaymentStatus = 'Unpaid';
  if (safeAdvance >= safeRent && safeRent > 0) {
    status = 'Paid';
  } else if (safeAdvance > 0) {
    status = 'Partial';
  } else {
    status = 'Unpaid';
  }

  return { remaining, status };
}

// Date formatting helper (e.g. 2026-08-01 -> 01 Aug, 2026)
export function formatDatePretty(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, '0');

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  if (monthIdx < 0 || monthIdx > 11) return dateStr;

  return `${day} ${monthNames[monthIdx]}, ${year}`;
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  const formattedStart = startDate ? formatDatePretty(startDate) : '';
  const formattedEnd = endDate ? formatDatePretty(endDate) : '';

  if (formattedStart && formattedEnd) {
    if (formattedStart === formattedEnd) return formattedStart;
    return `${formattedStart} to ${formattedEnd}`;
  }
  return formattedStart || formattedEnd || '';
}

// Local Storage helpers
export function getLocalEvents(): EventItem[] {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(SAMPLE_EVENTS));
      return SAMPLE_EVENTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read local events:', err);
    return SAMPLE_EVENTS;
  }
}

export function saveLocalEvents(events: EventItem[]): void {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save local events:', err);
  }
}

export function getLocalBookings(): VendorBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(SAMPLE_BOOKINGS));
      return SAMPLE_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read local bookings:', err);
    return SAMPLE_BOOKINGS;
  }
}

export function saveLocalBookings(bookings: VendorBooking[]): void {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('Failed to save local bookings:', err);
  }
}

export const HARDCODED_SUPABASE_URL = 'https://svuqgpwpmxpxpdrrtmwa.supabase.co';
export const HARDCODED_SUPABASE_ANON_KEY = 'sb_publishable_yc0qf8TYsQbvkPArH3piMw_U3k2Z1OA';

// Supabase helper
export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch (err) {
    console.error('Error reading Supabase config:', err);
  }

  return {
    url: HARDCODED_SUPABASE_URL,
    anonKey: HARDCODED_SUPABASE_ANON_KEY,
  };
}

export function saveSupabaseConfig(cfg: SupabaseConfig): void {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(cfg));
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.anonKey) {
    try {
      return createClient(cfg.url, cfg.anonKey);
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
    }
  }
  return null;
}

// Stats calculator for an event
export function calculateEventDashboardStats(
  event: EventItem,
  bookings: VendorBooking[]
) {
  const eventBookings = bookings.filter((b) => b.eventId === event.id);

  const fBookings = eventBookings.filter((b) => b.series === 'F');
  const sBookings = eventBookings.filter((b) => b.series === 'S');
  const fBooked = fBookings.length;
  const sBooked = sBookings.length;

  // --- Dynamic series stats (new model) ---
  const seriesStats: import('../types').SeriesStat[] = [];

  if (event.stallSeriesConfigs && event.stallSeriesConfigs.length > 0) {
    // Dynamic categories: count bookings where stallCategory matches the config name
    event.stallSeriesConfigs.forEach((cfg) => {
      const catBooked = eventBookings.filter(
        (b) => b.stallCategory === cfg.name
      ).length;
      seriesStats.push({
        name: cfg.name,
        limit: cfg.limit,
        booked: catBooked,
        available: Math.max(0, cfg.limit - catBooked),
      });
    });
  } else {
    // Legacy F / S model
    seriesStats.push({
      name: 'F Series',
      limit: event.fSeriesLimit,
      booked: fBooked,
      available: Math.max(0, event.fSeriesLimit - fBooked),
    });
    seriesStats.push({
      name: 'S Series',
      limit: event.sSeriesLimit,
      booked: sBooked,
      available: Math.max(0, event.sSeriesLimit - sBooked),
    });
  }

  const totalStallsLimit = seriesStats.reduce((sum, s) => sum + s.limit, 0);
  const stallsBooked = eventBookings.length;
  const stallsAvailable = Math.max(0, totalStallsLimit - stallsBooked);

  let totalValue = 0;
  let totalCollected = 0;
  let totalPending = 0;

  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;

  eventBookings.forEach((b) => {
    totalValue += b.stallRent || 0;
    totalCollected += b.stallAdvance || 0;
    totalPending += b.remainingBalance || 0;

    if (b.calculatedStatus === 'Paid') paidCount++;
    else if (b.calculatedStatus === 'Partial') partialCount++;
    else unpaidCount++;
  });

  return {
    totalStalls: totalStallsLimit,
    stallsBooked,
    stallsAvailable,
    totalValue,
    totalCollected,
    totalPending,
    fBooked,
    fLimit: event.fSeriesLimit,
    sBooked,
    sLimit: event.sSeriesLimit,
    seriesStats,
    paidCount,
    partialCount,
    unpaidCount,

  };
}

// SQL Generator helper for Supabase table creation
export const SUPABASE_SETUP_SQL = `-- Run this in your Supabase SQL Editor to create tables for SliceEVENT

-- 1. Create Events Table
create table if not exists public.events (
  id text primary key,
  name text not null,
  location text not null,
  start_date text not null,
  end_date text not null,
  timing text not null,
  map_location text,
  f_series_limit integer default 100,
  s_series_limit integer default 20,
  layout_image_url text,
  banner_image_url text,
  is_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create Stall Bookings Table
create table if not exists public.stall_bookings (
  id text primary key,
  event_id text references public.events(id) on delete cascade,
  series text check (series in ('F', 'S')),
  exhibitor_name text not null,
  stall_name text not null,
  mobile_number text not null,
  stall_number text not null,
  booking_date text not null,
  stall_category text not null,
  stall_rent numeric default 0,
  stall_advance numeric default 0,
  remaining_balance numeric default 0,
  payment_mode text default 'UPI / QR Code',
  calculated_status text default 'Unpaid',
  notes text,
  payment_logs jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS) & Allow Public Read/Write for PWA
alter table public.events enable row level security;
alter table public.stall_bookings enable row level security;

create policy "Allow anonymous access on events" on public.events for all using (true) with check (true);
create policy "Allow anonymous access on stall_bookings" on public.stall_bookings for all using (true) with check (true);

-- Enable Realtime WebSockets for instant multi-device create/delete sync
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.stall_bookings;
`;
