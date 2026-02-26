import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { KnowledgeGraphSection } from "@/components/landing/knowledge-graph-section";
import { DailyReviewSection } from "@/components/landing/daily-review-section";
import { CallToActionSection } from "@/components/landing/call-to-action-section";

export default function Home() {
  return (
    <main className="relative isolate flex w-full flex-col gap-16 overflow-hidden px-4 pt-6 pb-12 lg:gap-20 lg:px-8 lg:pt-10 lg:pb-20">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <KnowledgeGraphSection />
      <DailyReviewSection />
      <CallToActionSection />
    </main>
  );
}
