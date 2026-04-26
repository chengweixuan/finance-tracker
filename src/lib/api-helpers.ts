import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    return { error: errorResponse(message, 400) };
  }
  return { data: result.data };
}
