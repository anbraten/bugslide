import { eq, inArray } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const db = await useDb(event);
  const project = await requireProject(event, getRouterParam(event, 'projectId'));

  const errors = await db.select({ id: errorsTable.id }).from(errorsTable).where(eq(errorsTable.projectId, project.id));
  const errorIds = errors.map((error) => error.id);

  if (errorIds.length > 0) {
    await db.delete(errorEventsTable).where(inArray(errorEventsTable.error, errorIds));
  }
  await db.delete(errorsTable).where(eq(errorsTable.projectId, project.id));
  await db.delete(logsTable).where(eq(logsTable.projectId, project.id));
  await db.delete(artifactBundleFilesTable).where(eq(artifactBundleFilesTable.projectId, project.id));
  await db.delete(releasesTable).where(eq(releasesTable.projectId, project.id));
  await db.delete(userProjectsTable).where(eq(userProjectsTable.projectId, project.id));
  await db.delete(projectsTable).where(eq(projectsTable.id, project.id));

  try {
    const config = useRuntimeConfig(event);
    if (config.s3.endpoint && config.s3.accessKey && config.s3.secretKey) {
      const s3Client = await getS3Client();
      await deleteS3Prefix(s3Client, config.s3.bucket, `projects/${project.id}/`);
      await deleteS3Prefix(s3Client, config.s3.bucket, `uploads/${project.id}/`);
    }
  } catch (error) {
    console.error(`Failed to clean up S3 files for deleted project ${project.id}:`, error);
  }

  return { ok: true };
});
