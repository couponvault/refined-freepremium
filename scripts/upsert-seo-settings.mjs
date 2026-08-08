import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const rows = [
  [
    "seoTitle",
    "FreePremium – Free HD Porn Videos & XXX Sex Videos Online",
  ],
  [
    "seoDescription",
    "Watch free HD porn videos and XXX sex videos online. Stream premium adult videos with top pornstars — fast, free, no sign-up required. Updated daily.",
  ],
  [
    "seoKeywords",
    "free porn, porn videos, xxx videos, free sex videos, HD porn, adult videos, pornstars, free xxx, sex videos, porn tube, free HD porn, xxx tube",
  ],
];

for (const [key, value] of rows) {
  const existing = await db.setting.findUnique({ where: { key } });
  if (!existing?.value?.trim()) {
    await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    console.log("set", key);
    continue;
  }
  const v = existing.value.toLowerCase();
  const generic =
    v.includes("anime") ||
    v.includes("movies") ||
    (!v.includes("porn") &&
      !v.includes("xxx") &&
      !v.includes("adult") &&
      key !== "seoKeywords");
  if (generic || key === "seoKeywords") {
    await db.setting.update({ where: { key }, data: { value } });
    console.log("updated", key);
  } else {
    console.log("keep", key);
  }
}

await db.$disconnect();
