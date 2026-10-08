// Data shown in the app header for a project. The project page awaits it, so navigation waits
// until it is loaded, and the header reads the same cached entries without fetching again.
export function useProjectHeader(projectId: MaybeRefOrGetter<string>) {
  const id = () => toValue(projectId);

  const project = useFetch(() => `/api/projects/${id()}`, {
    key: () => `project-header:${id()}`,
  });

  const openErrors = useFetch(() => `/api/projects/${id()}/errors`, {
    key: () => `project-header:${id()}:open-errors`,
    query: {
      state: 'open',
      limit: 1,
    },
    default: () => ({ total: 0 }),
  });

  const releases = useFetch(() => `/api/projects/${id()}/releases`, {
    key: () => `project-header:${id()}:releases`,
    default: () => [],
  });

  return { project, openErrors, releases };
}
