import { createSignal, onMount, createEffect, createMemo, Accessor, on } from 'solid-js';

import Trash from 'lucide-solid/icons/trash';
import Pen from 'lucide-solid/icons/pen';

import TimeTopCards from '@/components/03 - Track/Time/TimeTopCards';
import ChartsGrid from '@/components/03 - Track/Time/ChartsGrid';
import Timeline from '@/components/03 - Track/Time/Timeline';
import TimeRangeSelectors from '@/components/03 - Track/Time/TimeRangeSelectors';

import { getActivityWatchEvents, emptyDb } from '@/utils/track/awUtils';
import Modal from '@/components/core/Modal';

export default function Time() {

  // --- STATE MANAGEMENT ---
  const today = new Date();
  const initialEnd = new Date(today);

  const initialStart = new Date(today);
  initialStart.setDate(initialStart.getDate() - 6);
  initialStart.setHours(0, 0, 0, 0); // Normalize the initial start date

  const [start, setStart] = createSignal(initialStart);
  const [end, setEnd] = createSignal(initialEnd);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);

  const [events, setEvents] = createSignal<any[]>([]);
  const [timelineDay, setTimelineDay] = createSignal(new Date());
  const [period, setPeriod] = createSignal<'week' | 'month' | 'quarter'>('week');

  // --- DATA FETCHING ---
  const fetchEvents = async () => {
    const eventsData = await getActivityWatchEvents(start(), end());
    setEvents(eventsData);
  };

  const refreshEvents = async () => {
    localStorage.removeItem('activity-watch-event-cache');
    await fetchEvents();
  };

  onMount(fetchEvents);
  createEffect(on([start, end], fetchEvents, { defer: true }));

  const timelineEvents: Accessor<any[]> = createMemo(() => {
    const dayStart = new Date(timelineDay());
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(timelineDay());
    dayEnd.setHours(23, 59, 59, 999);

    return events().filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= dayStart && eventDate <= dayEnd;
    });
  });

  createEffect(() => {
    // change start end end on period change
    if (period() === 'week') {
      const newStart = new Date(today);
      newStart.setDate(newStart.getDate() - 6);
      newStart.setHours(0, 0, 0, 0);
      setStart(newStart);
      setEnd(new Date(today));
    } else if (period() === 'month') {
      const newStart = new Date(today);
      newStart.setDate(1);
      newStart.setHours(0, 0, 0, 0);
      setStart(newStart);
      setEnd(new Date(today));
    } else if (period() === 'quarter') {
      const quarter = Math.floor((today.getMonth() + 3) / 3);
      const newStart = new Date(today.getFullYear(), (quarter - 1) * 3, 1, 0, 0, 0, 0);
      setStart(newStart);
      setEnd(new Date(today));
    }
  });

  return (
    <main class='flex flex-col h-full w-full p-8 px-16  gap-8 overflow-y-auto'>

      {/* Modal for confirming delete */}
      <Modal show={showDeleteModal()} onClose={() => setShowDeleteModal(false)}>
        <div class="p-4 center flex-col w-[20vw]">
          <h2 class="text-lg font-semibold mb-4">Confirm Delete</h2>
          <p class="mb-4">Are you sure you want to delete all events?</p>
          <button class="bg-red-600 text-text px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer" onClick={async () => {
            await emptyDb();
            setShowDeleteModal(false);
            fetchEvents();
          }}>Delete All Events</button>
        </div>
      </Modal>

      {/* Top cards display summary stats from all events */}
      <TimeTopCards events={events} period={period} />

      {/* Selectors to update the date range and the timeline day */}
      <TimeRangeSelectors
        period={period}
        setPeriod={setPeriod}
      />

      {/* Charts visualize data from all events */}
      <ChartsGrid events={events} timelineDay={timelineDay} period={period()} />

      {/* Timeline shows detailed activity for a single, selected day */}
      <Timeline
        eventsForDay={timelineEvents}
        timelineDay={timelineDay}
        setTimelineDay={setTimelineDay}
      />

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-12 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={setShowDeleteModal.bind(null, true)}>
        <Trash class="w-6 h-6 text-text " />
      </div>

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-12 bg-accent-dark-2 rounded-full p-2
                              hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={refreshEvents}>
        <Pen class="w-6 h-6 text-text " />
      </div>

    </main>
  );
}
