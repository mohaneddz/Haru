import { useLocation } from '@solidjs/router';

export default function Statebar() {

  const location = useLocation();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  (() => {
    setInterval(() => {
      const timeElement = document.querySelector('.time');
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }, 60000); 
  })();

  // Hide status bar when ingame
  const isInGame = location.pathname.includes('/play');

  if (isInGame) return null;

  return (

    <div class="relative bottom-0 w-full flex justify-between items-center px-6 opacity-75 text-text overflow-hidden z-50">

      {/* left side */}

        <div class="text-xs text-gray-400 capitalize">           {
            (() => {

              const segments = location.pathname
                .split('/')
                .map(s => s.replace(/-/g, ' '));

              return segments.length > 1
                ? segments.filter(Boolean).join(' > ')
                : '';
            })()
          }
        </div>

      {/* right side */}
      <div class="">
        <span class="text-xs text-gray-700">Time : </span>
        <span class="text-xs text-gray-500">{time}</span>
      </div>

    </div>
  );
};
