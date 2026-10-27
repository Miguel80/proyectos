import { NextResponse } from "next/server";
import { ZodError, flattenError } from "zod";

/** Contrato JSON estándar para route handlers y Server Actions. */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/** Error de aplicación con código estable y status HTTP asociado. */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function fail(
  code: string,
  message: string,
  details?: unknown,
): ApiFailure {
  return {
    ok: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
}

/** Convierte cualquier error en un ApiFailure sin filtrar detalles internos. */
export function toFailure(error: unknown): {
  failure: ApiFailure;
  status: number;
} {
  if (error instanceof AppError) {
    return {
      failure: fail(error.code, error.message, error.details),
      status: error.status,
    };
  }
  if (error instanceof ZodError) {
    return {
      failure: fail(
        "VALIDATION_ERROR",
        "Datos inválidos",
        flattenError(error).fieldErrors,
      ),
      status: 400,
    };
  }
  console.error("[unhandled]", error);
  return {
    failure: fail("INTERNAL_ERROR", "Error interno del servidor"),
    status: 500,
  };
}

export function jsonOk<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(ok(data), init);
}

export function jsonError(error: unknown): NextResponse<ApiFailure> {
  const { failure, status } = toFailure(error);
  return NextResponse.json(failure, { status });
}
