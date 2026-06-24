import HomeBanner from "@/components/sections/website/home/HomeBanner";
import MakingSection from "@/components/sections/website/home/MakingSection";
import AchievementsSection from "@/components/sections/website/home/AchievementsSection";
import PathSection from "@/components/sections/website/home/PathSection";

export default function Home() {
  return (
    <>
      <HomeBanner />
      <MakingSection />
      <AchievementsSection />
      <PathSection />
    </>
  );
}
