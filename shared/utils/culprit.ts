import type { StackFrame, Stacktrace } from '@sentry/core';

function isInAppFrame(frame: StackFrame) {
  return frame.in_app ?? !frame.filename?.includes('node_modules/');
}

/**
 * Short description of where an error was thrown, e.g. `formatSlot (useBooking.ts)`.
 * Uses the innermost in-app frame (Sentry orders frames oldest call first).
 */
export function getCulprit(stacktrace: Stacktrace | null | undefined): string | null {
  const frames = stacktrace?.frames ?? [];
  const frame = frames.findLast(isInAppFrame) ?? frames.at(-1);
  if (!frame) {
    return null;
  }

  const file = frame.filename?.replace(/\?.*$/, '').split('/').pop();
  const fn = frame.function && frame.function !== '?' ? frame.function : null;
  if (fn && file) {
    return `${fn} (${file})`;
  }
  return fn ?? file ?? null;
}
