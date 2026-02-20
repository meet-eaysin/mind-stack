import { IngestionForms } from "@/features/ingestion/components/ingestion-forms";

export default function Home() {
  return (
    <div className="space-y-12 py-8">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Ingest Knowledge
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-400">
          Add URLs, text, PDFs, or YouTube videos to your personal second brain.
          We&apos;ll chunk, embed, and build a knowledge graph for you.
        </p>
      </header>

      <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        <IngestionForms />
      </section>
    </div>
  );
}
