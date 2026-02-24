import { StackFrame } from '@sentry/core';
import { resolveSourceFrames } from '#server/utils/source-map';

export default defineEventHandler(async (event) => {
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const release = getRouterParam(event, 'releaseId');
  if (!release) {
    throw createError({
      statusCode: 400,
      message: 'Release parameter is required.',
    });
  }

  const { frames } = await readBody<{ frames: StackFrame[] }>(event);
  if (!frames || !Array.isArray(frames)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body, expected an array of stack frames.',
    });
  }

  return resolveSourceFrames(event, project.id.toString(), release, frames);
});
