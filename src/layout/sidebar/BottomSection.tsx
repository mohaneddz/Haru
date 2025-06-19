import { Settings, User } from "lucide-solid";

interface Props {
    setIsOpen: (isOpen: boolean) => void;
    isOpen: boolean;
}

export default function BottomSection(props : Props) {
  return (
    <div class={`h-24 flex items-center justify-between w-full px-4 py-2 bg-sidebar text-white ${props.isOpen ? 'flex-row' : 'flex-col gap-2'}`}>

      {/* user icon + username + settings button */}

      <a class="flex justify-center items-center gap-4" href="/auth/profile">

        <div class="bg-gradient-to-br from-primary to-primary-dark-3 rounded-full px-2 py-2 flex items-center gap-2 overflow-hidden">
          < User class="w-4 h-4 text-text" />
        </div>
        <span class={`truncate text-primary-dark-1 text-sm font-semibold ${props.isOpen ? 'w-30' : 'hidden'}`}>
          Mohaned_Dz
        </span>
      </a>

      <a href="/settings">
        < Settings class="w-6 h-6 text-primary-dark-1 hover:text-text hover:scale-105 hover:cursor-pointer transition duration-75" />
      </a>

    </div>
  );
};
