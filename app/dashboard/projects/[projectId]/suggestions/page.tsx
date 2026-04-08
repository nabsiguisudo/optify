import { AiSuggestionForm } from "@/components/forms/ai-suggestion-form";
import { getAiSuggestions } from "@/lib/data";

export default async function SuggestionsPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  const locale = (await searchParams).lang;
  const suggestions = await getAiSuggestions("", locale === "en" || locale === "it" || locale === "es" || locale === "de" ? locale : "fr");
  return <AiSuggestionForm initialSuggestions={suggestions} locale={locale} projectId={projectId} />;
}
