/**
 * Type-safe request parsing helpers for API routes.
 *
 * Every API route should validate its input with Zod via these helpers instead
 * of casting `request.json()` / `searchParams` with `as`. On invalid input we
 * return a uniform 422 envelope so clients can rely on a consistent shape.
 *
 * The schema type parameter is bound to `z.ZodType` and the data type is
 * derived via `z.infer<S>` so schemas built with `z.preprocess` / `z.coerce` /
 * `.default()` flow their real output type through — without this, the data
 * type would collapse to `unknown`.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
}

/** Uniform 422 response for validation failures. */
export function validationError(error: z.ZodError): NextResponse<ApiError> {
  return NextResponse.json<ApiError>(
    {
      error: "Validation failed",
      details: error.flatten(),
    },
    { status: 422 }
  );
}

/** Uniform 400 response for malformed request bodies (e.g. bad JSON). */
export function badRequest(message: string): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ error: "Bad request", message }, { status: 400 });
}

/** Uniform 500 response for unexpected server failures. */
export function internalError(message = "Internal server error"): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ error: message }, { status: 500 });
}

type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = { success: false; response: NextResponse<ApiError> };
type ParseResult<T> = ParseSuccess<T> | ParseFailure;

/**
 * Parses and validates a JSON request body against a Zod schema.
 * Returns `{ success: true, data }` or `{ success: false, response }` so the
 * caller can early-return the response on failure.
 */
export async function parseJsonBody<S extends z.ZodType>(
  request: NextRequest,
  schema: S
): Promise<ParseResult<z.infer<S>>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { success: false, response: badRequest("Invalid JSON body") };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { success: false, response: validationError(parsed.error) };
  }
  return { success: true, data: parsed.data };
}

/**
 * Validates query-string parameters against a Zod schema.
 *
 * Use `z.preprocess` (or `z.coerce`) to turn string params into numbers, and
 * supply a fallback so the field is always defined:
 *
 *   limit: z.preprocess((v) => (v === undefined ? 10 : Number(v)), z.number().int())
 *
 * All values arrive as strings from `searchParams`, so coercion is expected.
 */
export function parseQuery<S extends z.ZodType>(
  request: NextRequest,
  schema: S
): ParseResult<z.infer<S>> {
  const { searchParams } = new URL(request.url);
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, response: validationError(parsed.error) };
  }
  return { success: true, data: parsed.data };
}
