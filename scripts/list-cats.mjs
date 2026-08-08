import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const cats = await db.category.findMany({
  where: { enabled: true },
  orderBy: { order: "asc" },
  select: { name: true, slug: true },
});
console.log(JSON.stringify(cats, null, 2));
await db.$disconnect();
