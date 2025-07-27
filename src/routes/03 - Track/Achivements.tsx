import Ranking from '@/components/02 - Practice/Challenges/Ranking';
import AchivementCard from '@/components/03 - Track/achivements/AchivementCard';
import Input from '@/components/core/Input';

import { createSignal, createMemo, For } from 'solid-js';

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  points: number;
  category: string;
  unlocked: boolean;
}

export default function Achivements() {

  const [searchTerm, setSearchTerm] = createSignal('');

  const achievements: Achievement[] = [
    // Beginner Achievements
    { id: '1', unlocked: true, icon: 'Rocket', title: 'First Steps', description: 'Complete your first challenge to get started on your learning journey.', points: 10, category: 'beginner' },
    { id: '2', unlocked: true, icon: 'BookOpen', title: 'Knowledge Seeker', description: 'Read your first document and expand your understanding.', points: 15, category: 'beginner' },
    { id: '3', unlocked: true, icon: 'Play', title: 'Video Learner', description: 'Watch your first educational video to completion.', points: 15, category: 'beginner' },
    { id: '4', unlocked: true, icon: 'PenTool', title: 'Note Taker', description: 'Create your first set of study notes.', points: 20, category: 'beginner' },

    // Progress Achievements
    { id: '5', unlocked: false, icon: 'Target', title: 'Goal Setter', description: 'Set and achieve your first learning goal.', points: 25, category: 'progress' },
    { id: '6', unlocked: true, icon: 'Calendar', title: 'Consistent Learner', description: 'Study for 7 consecutive days without missing a session.', points: 50, category: 'progress' },
    { id: '7', unlocked: true, icon: 'Clock', title: 'Time Master', description: 'Complete 10 hours of focused study time.', points: 75, category: 'progress' },
    { id: '8', unlocked: true, icon: 'Trophy', title: 'Champion', description: 'Achieve a 90% or higher score on 5 different challenges.', points: 100, category: 'progress' },

    // Mastery Achievements
    { id: '9', unlocked: true, icon: 'Brain', title: 'Memory Master', description: 'Successfully recall information from 50 different study sessions.', points: 150, category: 'mastery' },
    { id: '10', unlocked: false, icon: 'Zap', title: 'Speed Demon', description: 'Complete 10 challenges in under 2 minutes each.', points: 125, category: 'mastery' },
    { id: '11', unlocked: true, icon: 'Star', title: 'Perfect Score', description: 'Achieve 100% accuracy on any advanced challenge.', points: 200, category: 'mastery' },
    { id: '12', unlocked: true, icon: 'Crown', title: 'Knowledge King', description: 'Master 5 different subject areas with excellent performance.', points: 300, category: 'mastery' },

    // Special Achievements
    { id: '13', unlocked: false, icon: 'Moon', title: 'Night Owl', description: 'Complete study sessions during late night hours (10 PM - 2 AM).', points: 30, category: 'special' },
    { id: '14', unlocked: true, icon: 'Sun', title: 'Early Bird', description: 'Complete study sessions during early morning hours (5 AM - 8 AM).', points: 30, category: 'special' }
  ];

  const filteredAchievements = createMemo(() => {
    const term = searchTerm().toLowerCase().trim();
    let filtered = achievements;
    
    if (term) {
      filtered = achievements.filter(achievement =>
        achievement.title.toLowerCase().includes(term) ||
        achievement.description.toLowerCase().includes(term) ||
        achievement.category.toLowerCase().includes(term)
      );
    }

    // Sort by unlocked status: unlocked first, then locked
    return filtered.sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return 0;
    });
  });

  return (
    <main class="flex flex-col items-center justify-center w-[90%] h-full">

      <div class="w-full">
        <Ranking />
      </div>

      <div class="bg-sidebar gap-4 w-full h-full p-4 border border-white/40 overflow-y-auto rounded-lg mb-4">

        <div class="my-8 mx-auto">
          <Input searchTerm={searchTerm()} setSearchTerm={setSearchTerm} />
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 auto-rows-max gap-4">
          <For each={filteredAchievements()}>
            {(achievement) => (
              <AchivementCard
                icon={achievement.icon}
                title={achievement.title}
                description={achievement.description}
                points={achievement.points}
                unlocked={achievement.unlocked}
              />
            )}
          </For>
        </div>

        {filteredAchievements().length === 0 && searchTerm().trim() !== '' && (
          <div class="text-center text-gray-400 mt-8">
            <p>No achievements found matching "{searchTerm()}"</p>
            <p class="text-sm mt-2">Try searching for different keywords or clear your search</p>
          </div>
        )}

      </div>
    </main>

  );
};
