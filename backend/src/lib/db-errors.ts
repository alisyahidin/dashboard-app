type PgError = { code?: string; constraint?: string };

export function isUniqueViolation(error: unknown, column: string): boolean {
  const pg = (error instanceof Error && error.cause ? error.cause : error) as PgError | null;
  return pg?.code === '23505' && Boolean(pg.constraint?.includes(column));
}
