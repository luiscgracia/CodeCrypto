// Try to extract a concise revert reason from common provider error formats
export function extractErrorMessage(err: unknown): string {
  const fallback = "Unknown error";
  if (!err) return fallback;

  // Prefer structured fields first
  try {
    const anyErr = err as any;
    if (typeof anyErr?.reason === "string" && anyErr.reason.trim()) {
      return anyErr.reason.trim();
    }
    if (typeof anyErr?.revert?.args?.[0] === "string" && anyErr.revert.args[0].trim()) {
      return anyErr.revert.args[0].trim();
    }
    if (typeof anyErr?.cause?.reason === "string" && anyErr.cause.reason.trim()) {
      return anyErr.cause.reason.trim();
    }
  } catch {
    // ignore
  }

  function extractFromMessage(msg: string): string {
    // reason="..."
    const reasonKv = msg.match(/reason\s*[:=]\s*"([^"]+)"/i);
    if (reasonKv && reasonKv[1]) return reasonKv[1].trim();
    // execution reverted: Reason
    const reverted = msg.match(/execution reverted(?: with reason string)?\s*:?\s*([^"\n\r]+)(?=(?:\"|\n|\r|$))/i);
    if (reverted && reverted[1]) return reverted[1].trim();
    // reverted: Reason
    const generic = msg.match(/reverted\s*:?\s*([^"\n\r]+)(?=(?:\"|\n|\r|$))/i);
    if (generic && generic[1]) return generic[1].trim();
    // Error("Reason")
    const errCtor = msg.match(/Error\(\"([^\"]+)\"\)/);
    if (errCtor && errCtor[1]) return errCtor[1].trim();
    // Shorten before JSON/parenthetical payloads
    const firstLine = msg.split(/[\n\r]/)[0];
    const parenIdx = firstLine.indexOf(" (");
    const short = parenIdx > 0 ? firstLine.slice(0, parenIdx).trim() : firstLine.trim();
    return short || fallback;
  }

  try {
    if ((err as any) instanceof Error) return extractFromMessage((err as Error).message);
    const e = err as { error?: { message?: unknown }; data?: { message?: unknown }; message?: unknown };
    if (typeof e?.error?.message === "string") return extractFromMessage(e.error.message);
    if (typeof e?.data?.message === "string") return extractFromMessage(e.data.message);
    if (typeof e?.message === "string") return extractFromMessage(e.message);
  } catch {
    // ignore
  }
  return fallback;
}
