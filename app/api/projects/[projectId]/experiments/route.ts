import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createExperiment, createExperimentSchema } from "@/lib/mutations";

function getFriendlyValidationMessage(error: ZodError) {
  return error.issues
    .map((issue) => {
      const field = issue.path[0];
      if (field === "name") return "Ajoute un nom d'expérience d'au moins 2 caractères.";
      if (field === "hypothesis") return "Décris brièvement l'objectif du test en au moins 8 caractères.";
      if (field === "pagePattern") return "Ajoute une page cible ou un pattern de page.";
      if (field === "selector") return "Sélectionne un élément Shopify ou renseigne un sélecteur CSS.";
      return issue.message;
    })
    .join(" ");
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = createExperimentSchema.parse({ ...(await request.json()), projectId });
    const experiment = await createExperiment(body);
    return NextResponse.json({ experiment });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: getFriendlyValidationMessage(error) },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unable to create experiment";
    if (message.includes("experiments_primary_metric_check")) {
      return NextResponse.json(
        {
          error: "La base Supabase doit être mise à jour pour accepter cette métrique. Exécute la migration du champ primary_metric puis réessaie."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
