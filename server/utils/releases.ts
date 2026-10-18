import { and, eq } from 'drizzle-orm';
import type { H3Event } from 'h3';

export async function createOrGetRelease(event: H3Event, project: Project, release: string) {
  const db = await useDb(event);

  // check if release already exists
  const existingRelease = await getFirstElement(
    db
      .select()
      .from(releasesTable)
      .where(and(eq(releasesTable.projectId, project.id), eq(releasesTable.version, release))),
  );

  if (existingRelease) {
    return existingRelease;
  }

  // create new release
  const res = await db
    .insert(releasesTable)
    .values({
      projectId: project.id,
      version: release,
      createdAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  const created = res?.[0];
  if (created) {
    return created;
  }

  // a concurrent request created it between our select and insert
  const raced = await getFirstElement(
    db
      .select()
      .from(releasesTable)
      .where(and(eq(releasesTable.projectId, project.id), eq(releasesTable.version, release))),
  );
  if (!raced) {
    throw new Error('Failed to create release');
  }

  return raced;
}
