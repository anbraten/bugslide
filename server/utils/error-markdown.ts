import type { Breadcrumb, Event, Mechanism, StackFrame } from '@sentry/core';
import type { CaughtError } from './db';

const MAX_BREADCRUMBS = 20;

function formatFrame(frame: StackFrame) {
  const location = `${frame.filename ?? '?'}:${frame.lineno ?? '?'}:${frame.colno ?? '?'}`;
  const head = `- ${frame.function ?? '<anonymous>'} (${location})`;

  const lines = [...(frame.pre_context ?? []), frame.context_line, ...(frame.post_context ?? [])];
  if (frame.context_line === undefined || frame.lineno === undefined) {
    return head;
  }

  const start = frame.lineno - (frame.pre_context?.length ?? 0);
  const code = lines
    .map((line, i) => `${start + i === frame.lineno ? '>' : ' '} ${start + i} | ${line ?? ''}`)
    .join('\n');
  return `${head}\n  \`\`\`\n${code.replace(/^/gm, '  ')}\n  \`\`\``;
}

function formatBreadcrumb(crumb: Breadcrumb, eventTime?: number) {
  const data = crumb.data ?? {};
  const relative =
    crumb.timestamp && eventTime ? `${(crumb.timestamp - eventTime).toFixed(1).replace(/^(\d)/, '+$1')}s` : '';

  let text: string;
  if (crumb.category === 'fetch' || crumb.category === 'xhr') {
    text = [data.method, data.url].filter(Boolean).join(' ') + (data.status_code ? ` → ${data.status_code}` : '');
  } else if (crumb.category === 'navigation') {
    text = data.from ? `${data.from} → ${data.to}` : String(data.to ?? '');
  } else {
    text = crumb.message ?? (crumb.data ? JSON.stringify(crumb.data) : '');
  }

  return `- ${relative ? `${relative} ` : ''}[${crumb.category ?? crumb.type ?? 'default'}] ${text}`.trimEnd();
}

// Markdown summary of one error event to paste into an AI assistant
export function errorToMarkdown({
  error,
  url,
  eventId,
  release,
  sentryEvent,
  mechanism,
  frames,
}: {
  error: CaughtError;
  url: string;
  eventId: number;
  release: string | null;
  sentryEvent?: Event;
  mechanism?: Mechanism;
  frames: StackFrame[]; // oldest call first, source mapped if possible
}) {
  const out: string[] = [`# ${error.title}${error.value ? `: ${error.value}` : ''}`, ''];

  const meta = [
    `State: ${error.state}`,
    `Events: ${error.events}`,
    `Event: #${eventId}`,
    release && `Release: ${release}`,
    mechanism && `Mechanism: ${mechanism.type}${mechanism.handled === false ? ' (unhandled)' : ''}`,
    sentryEvent?.environment && `Environment: ${sentryEvent.environment}`,
    sentryEvent?.platform && `Platform: ${sentryEvent.platform}`,
    sentryEvent?.server_name && `Server: ${sentryEvent.server_name}`,
    sentryEvent?.transaction && `Transaction: ${sentryEvent.transaction}`,
    `URL: ${url}`,
  ].filter(Boolean);
  out.push(...meta.map((m) => `- ${m}`), '');

  if (frames.length > 0) {
    const inApp = frames.filter((f) => f.in_app ?? !f.filename?.includes('node_modules/'));
    // most recent call first, hide dependencies if there is app code
    const shown = (inApp.length > 0 ? inApp : frames).toReversed();
    out.push('## Stack trace (most recent call first)', '', ...shown.map(formatFrame), '');
  }
  else {
    out.push('## Stack trace', '', 'The SDK sent no stack frames for this event.', '');
  }

  const crumbs = (sentryEvent?.breadcrumbs ?? []).slice(-MAX_BREADCRUMBS);
  if (crumbs.length > 0) {
    out.push(
      '## Breadcrumbs (oldest first)',
      '',
      ...crumbs.map((c) => formatBreadcrumb(c, sentryEvent?.timestamp)),
      '',
    );
  }

  const { id, email, username } = sentryEvent?.user ?? {};
  if (id || email || username) {
    out.push('## User', '', [id && `id: ${id}`, username && `username: ${username}`, email && `email: ${email}`].filter(Boolean).join(', '), '');
  }

  const tags = Object.entries(sentryEvent?.tags ?? {});
  if (tags.length > 0) {
    out.push('## Tags', '', ...tags.map(([k, v]) => `- ${k}: ${String(v)}`), '');
  }

  if (sentryEvent?.request?.url) {
    out.push('## Request', '', `${sentryEvent.request.method ?? 'GET'} ${sentryEvent.request.url}`, '');
  }

  return out.join('\n').trimEnd() + '\n';
}
