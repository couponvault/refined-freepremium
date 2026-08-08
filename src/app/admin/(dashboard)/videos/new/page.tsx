import { db } from "@/lib/db";
import VideoForm from "@/components/admin/VideoForm";

export default async function NewVideoPage() {
  const [categories, performers] = await Promise.all([
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
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Add video</h1>
      <VideoForm categories={categories} performers={performers} />
    </div>
  );
}
