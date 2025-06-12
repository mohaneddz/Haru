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

  return (

    <div class="relative bottom-0 w-full flex justify-between items-center px-6 opacity-75 text-white overflow-hidden">

      {/* left side */}

        <div class="text-xs text-gray-400 capitalize">           {
            (() => {
              console.log('Location:', location.pathname);

              const segments = location.pathname
                .split('/')
                .map(s => s.replace(/-/g, ' '));

              console.log('Segments:', segments);

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
