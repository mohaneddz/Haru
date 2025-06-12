import logo from '@/assets/logo-transparent.png';

export default function TopSection() {
  return (

    <div class='flex items-center w-full  gap-4 text-white pt-2'>

      <img src={logo} alt="Logo" class="w-16 h-16 ml-8 mb-4" />
      <span class='text-primary font-black text-lg'>Haru</span>

    </div>
  );
};
