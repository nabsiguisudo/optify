import { ExperimentForm } from "@/components/forms/experiment-form";

export default async function NewExperimentPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { projectId } = await params;
  const locale = (await searchParams).lang;
  return <ExperimentForm projectId={projectId} locale={locale} />;
}
