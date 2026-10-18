import React, { useState, useEffect } from 'react';
import { EventItem, VendorBooking, StallSeries } from './types';
import {
  getLocalEvents,
  saveLocalEvents,
  getLocalBookings,
  saveLocalBookings,
  getSupabaseClient,
  getSupabaseConfig,
} from './lib/storage';

import { Navigation, NavTab } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { CreateEventView } from './components/CreateEventView';
import { CompletedEventsView } from './components/CompletedEventsView';
import { EventDetailsView } from './components/EventDetailsView';
import { SeriesStallsView } from './components/SeriesStallsView';
import { SupportView } from './components/SupportView';
import { SupabaseModal } from './components/SupabaseModal';

export type ViewScreen =
  | 'home'
  | 'create-event'
  | 'completed-events'
  | 'event-details'
  | 'f-series'
  | 's-series'
  | 'support';

export default function App() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const [currentScreen, setCurrentScreen] = useState<ViewScreen>('home');
  const [editingEventItem, setEditingEventItem] = useState<EventItem | null>(null);

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Initial Load from local persistence + Supabase Realtime WebSocket Subscription
  useEffect(() => {
    const localEvts = getLocalEvents();
    const localBks = getLocalBookings();

    setEvents(localEvts);
    setBookings(localBks);

    const cfg = getSupabaseConfig();
    if (cfg) {
      setIsSupabaseConnected(true);
      syncWithSupabase();
    }

    const client = getSupabaseClient();
    if (client) {
      const channel = client
        .channel('velvet_db_realtime_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'events' },
          () => {
            syncWithSupabase();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stall_bookings' },
          () => {
            syncWithSupabase();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, []);

  // Sync function with Supabase (Mirrors exact database state, including deletions)
  const syncWithSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsSupabaseConnected(false);
      return;
    }

    try {
      // 1. Fetch remote events
      const { data: remoteEvents, error: evtErr } = await client
        .from('events')
        .select('*');

      if (!evtErr && Array.isArray(remoteEvents)) {
        const mappedRemoteEvts: EventItem[] = remoteEvents.map((r: any) => ({
          id: r.id,
          name: r.name,
          location: r.location,
          startDate: r.start_date,
          endDate: r.end_date,
          timing: r.timing,
          mapLocation: r.map_location,
          fSeriesLimit: r.f_series_limit || 100,
          sSeriesLimit: r.s_series_limit || 20,
          layoutImageUrl: r.layout_image_url,
          bannerImageUrl: r.banner_image_url,
          isCompleted: Boolean(r.is_completed),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));

        setEvents(mappedRemoteEvts);
        saveLocalEvents(mappedRemoteEvts);
      }

      // 2. Fetch remote bookings
      const { data: remoteBookings, error: bkErr } = await client
        .from('stall_bookings')
        .select('*');

      if (!bkErr && Array.isArray(remoteBookings)) {
        const mappedRemoteBks: VendorBooking[] = remoteBookings.map((r: any) => ({
          id: r.id,
          eventId: r.event_id,
          series: r.series as StallSeries,
          exhibitorName: r.exhibitor_name,
          stallName: r.stall_name,
          mobileNumber: r.mobile_number,
          stallNumber: r.stall_number,
          bookingDate: r.booking_date,
          stallCategory: r.stall_category,
          stallRent: Number(r.stall_rent) || 0,
          stallAdvance: Number(r.stall_advance) || 0,
          remainingBalance: Number(r.remaining_balance) || 0,
          paymentMode: r.payment_mode,
          calculatedStatus: r.calculated_status,
          notes: r.notes,
          paymentLogs: r.payment_logs || [],
          createdAt: r.created_at,
        }));

        setBookings(mappedRemoteBks);
        saveLocalBookings(mappedRemoteBks);
      }

      setIsSupabaseConnected(true);
    } catch (err) {
      console.warn('Supabase sync warning (using local store):', err);
      setIsSupabaseConnected(false);
    }
  };

  // Save Event handler
  const handleSaveEvent = async (
    eventData: Omit<EventItem, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    let updatedList: EventItem[];
    let targetEvent: EventItem;

    const now = new Date().toISOString();

    if (existingId) {
      // Edit existing event
      updatedList = events.map((e) => {
        if (e.id === existingId) {
          targetEvent = {
            ...e,
            ...eventData,
            updatedAt: now,
          };
          return targetEvent;
        }
        return e;
      });
      // @ts-ignore
      if (!targetEvent) targetEvent = { ...eventData, id: existingId, createdAt: now, updatedAt: now };
    } else {
      // Create new event
      const newId = `evt-${Date.now()}`;
      targetEvent = {
        ...eventData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [targetEvent, ...events];
    }

    setEvents(updatedList);
    saveLocalEvents(updatedList);
    setSelectedEvent(targetEvent);

    // Remote sync if Supabase client available
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('events').upsert({
          id: targetEvent.id,
          name: targetEvent.name,
          location: targetEvent.location,
          start_date: targetEvent.startDate,
          end_date: targetEvent.endDate,
          timing: targetEvent.timing,
          map_location: targetEvent.mapLocation,
          f_series_limit: targetEvent.fSeriesLimit,
          s_series_limit: targetEvent.sSeriesLimit,
          layout_image_url: targetEvent.layoutImageUrl,
          banner_image_url: targetEvent.bannerImageUrl,
          is_completed: targetEvent.isCompleted,
          updated_at: now,
        });
      } catch (err) {
        console.error('Failed to sync event to Supabase:', err);
      }
    }

    // Go to event details directly
    setCurrentScreen('event-details');
  };

  // Delete Event handler
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    const targetId = selectedEvent.id;
    const updatedEvts = events.filter((e) => e.id !== targetId);
    const updatedBks = bookings.filter((b) => b.eventId !== targetId);

    setEvents(updatedEvts);
    setBookings(updatedBks);
    saveLocalEvents(updatedEvts);
    saveLocalBookings(updatedBks);

    setSelectedEvent(null);
    setCurrentScreen('home');

    // Remote sync
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('events').delete().eq('id', targetId);
      } catch (err) {
        console.error('Failed to delete event from Supabase:', err);
      }
    }
  };

  // Toggle Complete / Active
  const handleToggleComplete = async () => {
    if (!selectedEvent) return;

    const newCompleted = !selectedEvent.isCompleted;
    const updatedEvt = { ...selectedEvent, isCompleted: newCompleted, updatedAt: new Date().toISOString() };

    const updatedEvts = events.map((e) => (e.id === updatedEvt.id ? updatedEvt : e));
    setEvents(updatedEvts);
    saveLocalEvents(updatedEvts);
    setSelectedEvent(updatedEvt);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('events').update({ is_completed: newCompleted }).eq('id', updatedEvt.id);
      } catch (err) {
        console.error('Failed to update event status in Supabase:', err);
      }
    }
  };

  // Save Vendor Booking handler
  const handleSaveBooking = async (
    bookingData: Omit<VendorBooking, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    let updatedBks: VendorBooking[];
    let targetBk: VendorBooking;
    const now = new Date().toISOString();

    if (existingId) {
      updatedBks = bookings.map((b) => {
        if (b.id === existingId) {
          targetBk = { ...b, ...bookingData };
          return targetBk;
        }
        return b;
      });
    } else {
      const newBkId = `bk-${Date.now()}`;
      targetBk = {
        ...bookingData,
        id: newBkId,
        createdAt: now,
      };
      updatedBks = [targetBk, ...bookings];
    }

    setBookings(updatedBks);
    saveLocalBookings(updatedBks);

    // Remote sync
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('stall_bookings').upsert({
          id: targetBk.id,
          event_id: targetBk.eventId,
          series: targetBk.series,
          exhibitor_name: targetBk.exhibitorName,
          stall_name: targetBk.stallName,
          mobile_number: targetBk.mobileNumber,
          stall_number: targetBk.stallNumber,
          booking_date: targetBk.bookingDate,
          stall_category: targetBk.stallCategory,
          stall_rent: targetBk.stallRent,
          stall_advance: targetBk.stallAdvance,
          remaining_balance: targetBk.remainingBalance,
          payment_mode: targetBk.paymentMode,
          calculated_status: targetBk.calculatedStatus,
          notes: targetBk.notes,
          payment_logs: targetBk.paymentLogs || [],
        });
      } catch (err) {
        console.error('Failed to sync booking to Supabase:', err);
      }
    }
  };

  // Delete Vendor Booking
  const handleDeleteBooking = async (bookingId: string) => {
    const updatedBks = bookings.filter((b) => b.id !== bookingId);
    setBookings(updatedBks);
    saveLocalBookings(updatedBks);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('stall_bookings').delete().eq('id', bookingId);
      } catch (err) {
        console.error('Failed to delete booking from Supabase:', err);
      }
    }
  };

  // Export Data JSON
  const handleExportData = () => {
    const dataObj = {
      app: 'A Generative Slice',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      events,
      bookings,
    };

    const blob = new Blob([JSON.stringify(dataObj, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Velvet_Trunk_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Data JSON
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.events && Array.isArray(parsed.events)) {
          setEvents(parsed.events);
          saveLocalEvents(parsed.events);
        }
        if (parsed.bookings && Array.isArray(parsed.bookings)) {
          setBookings(parsed.bookings);
          saveLocalBookings(parsed.bookings);
        }
        alert('Data backup successfully restored!');
        setIsSupabaseModalOpen(false);
      } catch (err) {
        alert('Failed to parse JSON file. Please check file format.');
      }
    };
    reader.readAsText(file);
  };

  // Bottom Nav Tab mapper
  const getNavTabFromScreen = (screen: ViewScreen): NavTab => {
    if (screen === 'home') return 'home';
    if (screen === 'create-event') return 'create';
    if (screen === 'completed-events') return 'completed';
    if (screen === 'support') return 'support';
    return 'home';
  };

  const handleSelectNavTab = (tab: NavTab) => {
    if (tab === 'home') {
      setCurrentScreen('home');
    } else if (tab === 'create') {
      setEditingEventItem(null);
      setCurrentScreen('create-event');
    } else if (tab === 'completed') {
      setCurrentScreen('completed-events');
    } else if (tab === 'support') {
      setCurrentScreen('support');
    } else if (tab === 'supabase') {
      setIsSupabaseModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf7] text-[#1c1612] font-['Manrope',sans-serif]">
      {/* Navigation Header (Desktop Navbar & Mobile Bottom Bar) */}
      <Navigation
        currentTab={getNavTabFromScreen(currentScreen)}
        onSelectTab={handleSelectNavTab}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenSupportModal={() => setCurrentScreen('support')}
      />

      {/* Main Screen Container - Responsive max-w-7xl */}
      <main className="pt-4 md:pt-6 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
        {currentScreen === 'home' && (
          <HomeView
            events={events}
            bookings={bookings}
            onCreateEventClick={() => {
              setEditingEventItem(null);
              setCurrentScreen('create-event');
            }}
            onCompletedEventsClick={() => setCurrentScreen('completed-events')}
            onSelectEvent={(evt) => {
              setSelectedEvent(evt);
              setCurrentScreen('event-details');
            }}
          />
        )}

        {currentScreen === 'create-event' && (
          <CreateEventView
            initialEvent={editingEventItem}
            onSave={(data, existingId) => handleSaveEvent(data, existingId)}
            onBack={() => setCurrentScreen(selectedEvent ? 'event-details' : 'home')}
          />
        )}

        {currentScreen === 'completed-events' && (
          <CompletedEventsView
            events={events}
            bookings={bookings}
            onSelectEvent={(evt) => {
              setSelectedEvent(evt);
              setCurrentScreen('event-details');
            }}
            onReopenEvent={(evt) => {
              const reopened = { ...evt, isCompleted: false };
              const updatedEvts = events.map((e) => (e.id === evt.id ? reopened : e));
              setEvents(updatedEvts);
              saveLocalEvents(updatedEvts);
              setSelectedEvent(reopened);
              setCurrentScreen('event-details');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'event-details' && selectedEvent && (
          <EventDetailsView
            event={selectedEvent}
            bookings={bookings}
            onOpenFSeries={() => setCurrentScreen('f-series')}
            onOpenSSeries={() => setCurrentScreen('s-series')}
            onEditEvent={() => {
              setEditingEventItem(selectedEvent);
              setCurrentScreen('create-event');
            }}
            onDeleteEvent={handleDeleteEvent}
            onToggleComplete={handleToggleComplete}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'f-series' && selectedEvent && (
          <SeriesStallsView
            event={selectedEvent}
            series="F"
            bookings={bookings}
            onSaveBooking={handleSaveBooking}
            onDeleteBooking={handleDeleteBooking}
            onBack={() => setCurrentScreen('event-details')}
          />
        )}

        {currentScreen === 's-series' && selectedEvent && (
          <SeriesStallsView
            event={selectedEvent}
            series="S"
            bookings={bookings}
            onSaveBooking={handleSaveBooking}
            onDeleteBooking={handleDeleteBooking}
            onBack={() => setCurrentScreen('event-details')}
          />
        )}

        {currentScreen === 'support' && (
          <SupportView onBack={() => setCurrentScreen('home')} />
        )}
      </main>

      {/* Supabase Sync & Backup Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onSync={() => syncWithSupabase()}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
    </div>
  );
}
