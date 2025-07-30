import StatisticsTopBar from '@/components/02 - Practice/training/Flashcards/StatisticsTopBar';
import StatisticsMainContent from '@/components/02 - Practice/training/Flashcards/StatisticsMainContent';

export default function FlashCardsStatistics() {
  return (
    <div class="flex flex-col min-h-screen w-full p-8 px-16 gap-8 overflow-y-auto pb-24">

      <StatisticsTopBar />
      <StatisticsMainContent />

    </div>
  );
}