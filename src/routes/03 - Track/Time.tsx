import { createSignal, onMount, createEffect, createMemo, Accessor, on } from 'solid-js';
import { Trash, Pen } from 'lucide-solid';

import TimeTopCards from '@/components/03 - Track/Time/TimeTopCards';
import ChartsGrid from '@/components/03 - Track/Time/ChartsGrid';
import Timeline from '@/components/03 - Track/Time/Timeline';
import TimeRangeSelectors from '@/components/03 - Track/Time/TimeRangeSelectors';

import { getActivityWatchEvents, emptyDb } from '@/utils/track/awUtils';
import Modal from '@/components/core/Modal';

export default function Time() {
  // --- STATE MANAGEMENT ---
  // --- THE FIX for Initial State ---
  const today = new Date();
  const initialEnd = new Date(today);

  const initialStart = new Date(today);
  initialStart.setDate(initialStart.getDate() - 6);
  initialStart.setHours(0, 0, 0, 0); // Normalize the initial start date

  const [start, setStart] = createSignal(initialStart);
  const [end, setEnd] = createSignal(initialEnd);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  // --- END OF FIX ---

  const [events, setEvents] = createSignal<any[]>([]);
  const [timelineDay, setTimelineDay] = createSignal(new Date());

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

  return (
    <main class='flex flex-col h-full w-full p-8 px-16  gap-8 overflow-y-auto'>

      {/* Modal for confirming delete */}
      <Modal show={showDeleteModal()} onClose={() => setShowDeleteModal(false)}>
        <div class="p-4 center flex-col w-[20vw]">
          <h2 class="text-lg font-semibold mb-4">Confirm Delete</h2>
          <p class="mb-4">Are you sure you want to delete all events?</p>
          <button class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer" onClick={async () => {
            await emptyDb();
            setShowDeleteModal(false);
            fetchEvents();
          }}>Delete All Events</button>
        </div>
      </Modal>

      {/* Top cards display summary stats from all events */}
      <TimeTopCards events={events} />

      {/* Selectors to update the date range and the timeline day */}
      <TimeRangeSelectors
        start={start}
        setStart={setStart}
        end={end}
        setEnd={setEnd}
        timelineDay={timelineDay}
        setTimelineDay={setTimelineDay}
      />

      {/* Charts visualize data from all events */}
      <ChartsGrid events={events} timelineDay={timelineDay} />

      {/* Timeline shows detailed activity for a single, selected day */}
      <Timeline
        eventsForDay={timelineEvents}
        timelineDay={timelineDay}
        setTimelineDay={setTimelineDay}
      />

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-12 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={setShowDeleteModal.bind(null, true)}>
        <Trash class="w-6 h-6 text-white " />
      </div>

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-12 bg-accent-dark-2 rounded-full p-2
                              hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={refreshEvents}>
        <Pen class="w-6 h-6 text-white " />
      </div>

    </main>
  );
}
