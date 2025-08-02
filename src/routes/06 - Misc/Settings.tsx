import printTodayTimeline from '@/utils/track/awUtils';

export default function Settings() {

  return (
    <div>
      <button onClick={printTodayTimeline} class="px-2 py-3 hover:brightness-95 cursor-pointer hover:scale-95 active:scale-100 bg-accent text-white rounded-sm"> Print Today Timeline</button>
    </div>
  );
};
