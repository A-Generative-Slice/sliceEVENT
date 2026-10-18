export type StallSeries = string;

export type PaymentMode = 'UPI / QR Code' | 'Cash' | 'Bank Transfer' | 'Card';

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export type StallCategory =
  | 'Clothing & Apparel'
  | 'Jewelry & Accessories'
  | 'Footwear & Bags'
  | 'Artisan & Handicrafts'
  | 'Home Decor'
  | 'Beauty & Cosmetics'
  | 'Gourmet Food & Beverages'
  | 'Electronics & Gadgets'
  | 'Other';

export interface PaymentTransaction {
  id: string;
  amount: number;
  paymentMode: PaymentMode;
  date: string;
  note?: string;
  createdAt: string;
}

export interface VendorBooking {
  id: string;
  eventId: string;
  series: StallSeries;
  exhibitorName: string;
  stallName: string;
  mobileNumber: string;
  stallNumber: string;
  bookingDate: string;
  stallCategory: StallCategory | string;
  stallRent: number;
  stallAdvance: number;
  remainingBalance: number;
  paymentMode: PaymentMode;
  calculatedStatus: PaymentStatus;
  notes?: string;
  paymentLogs?: PaymentTransaction[];
  createdAt: string;
}

/** A dynamic stall series/category defined by the event organizer */
export interface StallSeriesConfig {
  id: string;    // unique identifier
  name: string;  // e.g. "F Series", "Premium Zone", "Corner Stalls"
  limit: number; // total stall count for this category
}

export interface EventItem {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  timing: string;
  mapLocation: string;
  /** Legacy fields - kept for backward compat with existing saved events */
  fSeriesLimit: number;
  sSeriesLimit: number;
  /** Dynamic stall category configs. When present, these replace fSeriesLimit/sSeriesLimit */
  stallSeriesConfigs?: StallSeriesConfig[];
  layoutImageUrl: string;
  bannerImageUrl?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Per-category breakdown used in dashboard stats */
export interface SeriesStat {
  name: string;
  limit: number;
  booked: number;
  available: number;
}

export interface EventDashboardStats {
  totalStalls: number;
  stallsBooked: number;
  stallsAvailable: number;
  totalValue: number;    // sum of stall rent
  totalCollected: number; // sum of advances/paid
  totalPending: number;  // sum of remaining balance
  /** Legacy F/S counts for backward compat */
  fBooked: number;
  fLimit: number;
  sBooked: number;
  sLimit: number;
  /** Per-category breakdown */
  seriesStats: SeriesStat[];
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
