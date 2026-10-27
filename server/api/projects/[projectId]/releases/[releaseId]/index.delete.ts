import { and, eq, inArray, isNotNull } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const project = await requireProject(event, getRouterParam(event, 'projectId'));
  const db = useDb(event);

  const version = getRouterParam(event, 'releaseId', { decode: true });
  if (!version) {
    throw createError({
      statusCode: 400,
      message: 'Release is required.',
    });
  }

  const release = await getFirstElement(
    db
      .select()
      .from(releasesTable)
      .where(and(eq(releasesTable.version, version), eq(releasesTable.projectId, project.id))),
  );

  if (!release) {
    throw createError({
      statusCode: 404,
      message: 'Release not found.',
    });
  }

  const bundles = await db
    .selectDistinct({ checksum: artifactBundleFilesTable.checksum })
    .from(artifactBundleFilesTable)
    .where(and(eq(artifactBundleFilesTable.releaseId, release.id), isNotNull(artifactBundleFilesTable.checksum)));
  const checksums = bundles.map((bundle) => bundle.checksum!);

  // events keep their release string, only the release and its uploaded files go away
  await db.delete(artifactBundleFilesTable).where(eq(artifactBundleFilesTable.releaseId, release.id));
  await db.delete(releasesTable).where(eq(releasesTable.id, release.id));

  // the same bundle (checksum) can be uploaded for multiple releases, keep the ones still in use
  const bundlesInUse =
    checksums.length > 0
      ? await db
          .selectDistinct({ checksum: artifactBundleFilesTable.checksum })
          .from(artifactBundleFilesTable)
          .where(
            and(
              eq(artifactBundleFilesTable.projectId, project.id),
              inArray(artifactBundleFilesTable.checksum, checksums),
            ),
          )
      : [];
  const unusedChecksums = checksums.filter((checksum) => !bundlesInUse.some((bundle) => bundle.checksum === checksum));

  try {
    const config = useRuntimeConfig(event);
    if (config.s3.endpoint && config.s3.accessKey && config.s3.secretKey) {
      const s3Client = getS3Client();
      for (const checksum of unusedChecksums) {
        await deleteS3Prefix(s3Client, `projects/${project.id}/artifact_bundles/${checksum}/`);
      }
      await deleteS3Prefix(s3Client, `projects/${project.id}/source_maps/${release.version}/`);
    }
  } catch (error) {
    console.error(`Failed to clean up S3 files for deleted release ${release.id}:`, error);
  }

  return { ok: true };
});
