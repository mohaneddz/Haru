import logo from '@/assets/logo-transparent.png';
// import { createSignal } from 'solid-js';

import { ChevronsLeft } from 'lucide-solid';

interface Props {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
}

export default function TopSection(props: Props) {
  return (

    <div class={`flex flex-nowrap items-center justify-center w-full text-white pt-2 ${props.isOpen ? ' gap-4' : ' '}`}>

      <img src={logo} alt="Logo" class={`mb-4 ${props.isOpen ? 'w-16 h-16 ml-8' : 'ml-2 w-10 h-10'}`} />

      {props.isOpen && <span class='text-primary font-black text-lg'>Haru</span>}

      <ChevronsLeft
        class={`text-primary w-min h-min ml-auto transition-transform duration-300 ease-in-out z-50 ${!props.isOpen ? 'rotate-180 mr-1 mb-2' : 'mr-8'}`}
        onClick={() => props.setIsOpen(!props.isOpen)}
      />

    </div>
  );
};