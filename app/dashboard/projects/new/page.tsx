import { ProjectForm } from "@/components/forms/project-form";

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = (await searchParams).lang;
  return (
    <div className="mx-auto max-w-3xl">
      <ProjectForm locale={locale} />
    </div>
  );
}
