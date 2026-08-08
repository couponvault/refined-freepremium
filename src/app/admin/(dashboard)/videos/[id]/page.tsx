import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import VideoForm from "@/components/admin/VideoForm";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [video, categories, performers] = await Promise.all([
    db.video.findUnique({
      where: { id },
      include: {
        performers: { select: { performerId: true } },
        videoCategories: { select: { categoryId: true } },
      },
    }),
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, icon: true, enabled: true },
    }),
    db.performer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        enabled: true,
      },
    }),
  ]);
  if (!video) notFound();
  const categoryIds =
    video.videoCategories.length > 0
      ? video.videoCategories.map((c) => c.categoryId)
      : video.categoryId != null
        ? [video.categoryId]
        : [];
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Edit video</h1>
      <VideoForm
        categories={categories}
        performers={performers}
        videoId={video.id}
        initial={{
          title: video.title,
          slug: video.slug,
          embedUrl: video.embedUrl,
          thumbnail: video.thumbnail,
          description: video.description,
          tags: video.tags,
          seoTitle: video.seoTitle,
          seoDescription: video.seoDescription,
          featured: video.featured,
          trending: video.trending,
          published: video.published,
          exclusive: video.exclusive,
          duration: video.duration,
          quality: video.quality,
          views: video.views,
          scheduledAt: video.scheduledAt?.toISOString() ?? null,
          categoryId: categoryIds[0] ?? null,
          categoryIds,
          performerIds: video.performers.map((p) => p.performerId),
        }}
      />
    </div>
  );
}
