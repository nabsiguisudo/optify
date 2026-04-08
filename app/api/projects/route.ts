import { NextResponse } from "next/server";
import { createProject, createProjectSchema } from "@/lib/mutations";

export async function POST(request: Request) {
  try {
    const body = createProjectSchema.parse(await request.json());
    const project = await createProject(body);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create project" },
      { status: 400 }
    );
  }
}
