import { StackFrame } from '@sentry/core';
import { resolveSourceFrames } from '~/server/utils/source-map';

type ResolvedFrame = {
  source: string;
  line: number;
  column: number;
  name?: string;
  context?: string[];
};

export default defineEventHandler(async (event) => {
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const release = getRouterParam(event, 'releaseId');
  if (!release) {
    throw createError({
      statusCode: 400,
      message: 'Release parameter is required.',
    });
  }

  // TODO: allow to upload source maps
  throw createError({
    statusCode: 501,
    message: 'Source map upload is not implemented yet.',
  });
});
