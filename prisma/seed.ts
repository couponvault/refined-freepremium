import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function avatar(slug: string) {
  return `https://i.pravatar.cc/400?u=${encodeURIComponent(slug)}`;
}

const CAT_ICONS: Record<string, string> = {
  movies: "🎬",
  anime: "🌸",
  music: "🎵",
  sports: "⚽",
  gaming: "🎮",
  documentaries: "🎥",
  amateur: "📱",
  anal: "🔥",
  asian: "🌏",
  bbw: "💋",
  blonde: "💛",
  brunette: "🤎",
  ebony: "🖤",
  latina: "🌶️",
  lesbian: "💕",
  milf: "👠",
  mature: "🍷",
  hentai: "🌸",
  gay: "🏳️‍🌈",
  trans: "🏳️‍⚧️",
  pov: "👁️",
  vr: "🥽",
  onlyfans: "💙",
};

/** Site + Pornhub-style category names (deduped by slug on seed). */
const CATEGORY_NAMES = [
  // General site
  "Movies",
  "Anime",
  "Music",
  "Sports",
  "Gaming",
  "Documentaries",
  // Popular tube categories
  "Amateur",
  "Anal",
  "Asian",
  "Babe",
  "Babysitter (18+)",
  "BBW",
  "Behind The Scenes",
  "Big Ass",
  "Big Dick",
  "Big Tits",
  "Bisexual",
  "Bisexual Male",
  "Blonde",
  "Blowjob",
  "Bondage",
  "Brazilian",
  "British",
  "Brunette",
  "Bukkake",
  "Cartoon",
  "Casting",
  "Celebrity",
  "Chubby",
  "College (18+)",
  "Compilation",
  "Cosplay",
  "Creampie",
  "Cuckold",
  "Cumshot",
  "Czech",
  "Described Video",
  "Double Penetration",
  "Ebony",
  "Euro",
  "Exclusive",
  "Feet",
  "Female Orgasm",
  "Fetish",
  "Fingering",
  "Fisting",
  "French",
  "Funny",
  "Gangbang",
  "Gay",
  "German",
  "Handjob",
  "Hardcore",
  "Hentai",
  "Hentai Uncensored",
  "Homemade",
  "Hotel",
  "Indian",
  "Interracial",
  "Italian",
  "Japanese",
  "Korean",
  "Latina",
  "Lesbian",
  "Lesbian Scissoring",
  "Massage",
  "Masturbation",
  "Mature",
  "MILF",
  "Muscular Men",
  "Music Video",
  "Old/Young (18+)",
  "OnlyFans",
  "Orgy",
  "Outdoor",
  "Party",
  "Pissing",
  "Pornstar",
  "POV",
  "Public",
  "Pussy Licking",
  "Reality",
  "Redhead",
  "Roleplay",
  "Romantic",
  "Rough Sex",
  "Russian",
  "School (18+)",
  "Scuba",
  "Small Tits",
  "Smoking",
  "Softcore",
  "Solo Female",
  "Solo Male",
  "Spanish",
  "Squirt",
  "Step Fantasy",
  "Stepmom",
  "Step Sister",
  "Stockings",
  "Strap On",
  "Striptease",
  "Tattooed Women",
  "Teacher",
  "Teen 18+",
  "Threesome",
  "Threesome FFM",
  "Threesome FMM",
  "Toys",
  "Trans",
  "Trans With Girl",
  "Trans With Guy",
  "Verified Amateurs",
  "Vintage",
  "Virtual Reality",
  "VR",
  "Webcam",
  "Wife",
  "60FPS",
  "4K",
  "HD",
  "ASMR",
  "JOI",
  "Arab",
  "Chinese",
  "Thai",
  "Filipina",
  "Nurse",
  "Office",
  "Parody",
  "Cheating",
  "Yoga",
  "Facial",
  "Swallow",
  "Pregnant",
  "Foot Fetish",
  "Group",
  "Rough",
  "Solo",
  "Teen Anal",
];

/** Well-known public stage names — placeholders for images; edit in Admin anytime. */
const PERFORMER_NAMES = [
  "Riley Reid",
  "Lana Rhoades",
  "Abella Danger",
  "Mia Khalifa",
  "Mia Malkova",
  "Angela White",
  "Lisa Ann",
  "Nikki Benz",
  "Jesse Jane",
  "Stoya",
  "Asa Akira",
  "Sasha Grey",
  "Tori Black",
  "Kayden Kross",
  "Riley Steele",
  "Jenna Jameson",
  "Stormy Daniels",
  "Johnny Sins",
  "Manuel Ferrara",
  "Rocco Siffredi",
  "Lexi Belle",
  "Remy LaCroix",
  "Kagney Linn Karter",
  "Nicole Aniston",
  "Rachel Starr",
  "Phoenix Marie",
  "Jada Stevens",
  "Kendra Lust",
  "Brandi Love",
  "Alexis Texas",
  "Sophie Dee",
  "Eva Lovia",
  "Adriana Chechik",
  "Megan Rain",
  "Gina Valentina",
  "Abigaile Johnson",
  "Little Caprice",
  "Nancy A",
  "Stacy Cruz",
  "Emily Willis",
  "Gia Derza",
  "Autumn Falls",
  "Gabbie Carter",
  "Violet Myers",
  "Lena Paul",
  "Quinn Wilde",
  "Elsie Hewitt",
  "Lana Smalls",
  "Scarlet Chase",
  "Apolonia Lapiedra",
  "Liya Silver",
  "Jia Lissa",
  "Sybil A",
  "Nancy Ace",
  "Ellie Leen",
  "Anissa Kate",
  "Aletta Ocean",
  "Black Angelika",
  "Ava Addams",
  "Cory Chase",
  "Reagan Foxx",
  "Cherie DeVille",
  "India Summer",
  "Julia Ann",
  "Nina Hartley",
  "Peta Jensen",
  "August Ames",
  "Janice Griffith",
  "Kimmy Granger",
  "Piper Perri",
  "Elsa Jean",
  "Kali Roses",
  "Kendra Spade",
  "Vina Sky",
  "Lulu Chu",
  "Nicole Doshi",
  "Kazumi",
  "Coco Lovecock",
  "Siri Dahl",
  "Valentina Nappi",
  "Abella Anderson",
  "Jynx Maze",
  "Rose Monroe",
  "Luna Star",
  "Canela Skin",
  "Katrina Moreno",
  "Sheila Ortega",
  "Susy Gala",
  "Blondie Fesser",
  "Kesha Ortega",
  "Katrina Jade",
  "Kissa Sins",
  "Christie Stevens",
  "Sara Jay",
  "Richelle Ryan",
  "Syren De Mer",
  "Dee Williams",
  "Ryan Keely",
  "London River",
  "Katie Morgan",
  "Ariella Ferrera",
  "Diamond Jackson",
  "Misty Stone",
  "Chanel Preston",
  "Dahlia Sky",
  "Veronica Avluv",
  "Tanya Tate",
  "Alura Jenson",
  "Holly Hendrix",
  "Gina Gerson",
  "Cindy Shine",
  "Lady Dee",
  "Nicole Love",
  "Tiffany Tatum",
  "Rebecca Volpetti",
  "Tina Kay",
  "Cara St Germain",
  "Marica Hase",
  "Hitomi Tanaka",
  "Anri Okita",
  "Rara Anzai",
  "Yua Mikami",
  "Akiho Yoshizawa",
  "Sora Aoi",
  "Maria Ozawa",
  "Alex Coal",
  "Jewelz Blu",
  "Avery Cristy",
  "Mackenzie Mace",
  "Chloe Temple",
  "Lily Larimar",
  "Molly Little",
  "Haley Reed",
  "Jane Wilde",
  "Khloe Kapri",
  "Gia Paige",
  "Cadence Lux",
  "Karla Kush",
  "Kristen Scott",
  "Whitney Wright",
  "Chloe Cherry",
  "Kyler Quinn",
  "Aria Lee",
  "Natalie Knight",
  "Emma Hix",
  "Alexis Crystal",
  "Lady Gang",
  "Jennifer Mendez",
  "Marilyn Crystal",
  "Shalina Devine",
  "Sienna Day",
  "Cassie Del Isla",
  "Chloe Lamour",
  "Kitana Lure",
  "Angel Wicky",
  "Patrícia Toth",
  "Lucy Li",
  "Paula Shy",
  "Clea Gaultier",
  "Claire Castel",
  "Liza Del Sierra",
  "Nikita Bellucci",
  "Cassie Fire",
  "Anna Polina",
  "Hennessy",
  "Lovenia Lux",
  "Red Fox",
  "Alessandra Jane",
  "Stefanie Moon",
  "Monica Brown",
  "Sara Diamante",
  "Martina Smeraldi",
  "Priscila Sol",
  "Venus Afrodita",
  "Ginebra Bellucci",
  "Jade Presley",
  "Melody Petite",
  "Julia De Lucia",
  "Ramon Nomar",
  "Mick Blue",
  "James Deen",
  "Danny Mountain",
  "Xander Corvus",
  "Charles Dera",
  "Toni Ribas",
  "Nacho Vidal",
  "Jordi El Nino Polla",
  "Bruce Venture",
  "Sean Lawless",
  "Isiah Maxwell",
  "Ricky Johnson",
  "Damon Dice",
  "Alex D",
  "Quinton James",
  "Lucas Frost",
  "Kyle Mason",
  "Codey Steele",
  "Dredd",
  "Jason Luv",
  "Prince Yahshua",
  "Mandingo",
  "Lexington Steele",
  "Mr Pete",
  "Erik Everhard",
  "Steve Holmes",
  "Markus Dupree",
  "Christian Clay",
  "Vince Karter",
  "Kristof Cale",
  "Charlie Dean",
  "Sam Bourne",
  "Danny D",
  "Chris Diamond",
  "Potro De Bilbao",
  "Alberto Blanco",
  "Nick Moreno",
  "Maximo Garcia",
  "Freddy Gong",
  "Joss Lescaf",
  "Mike Angelo",
  "Thomas Stone",
  "Lutro",
  "Raul Costa",
  "David Perry",
  "Ian Scott",
  "Ryan Ryder",
  "George Uhl",
  "Choky Ice",
  "Mugur",
  "Csoky Ice",
  "Matt Bird",
  "Joel Tomas",
  "Charlie Red",
  "Stacy Snake",
  "Katy Rose",
  "Nicole Pearl",
  "Madison Ivy",
  "Destiny Dixon",
  "Amy Anderssen",
  "Sophie Anderson",
  "Busty Buffy",
  "Lucie Wilde",
  "Katarina Hartlova",
  "Erin Star",
  "Vivian Blush",
  "Dolly Fox",
  "Alexya",
  "Sha Rizel",
  "Rion Nishikawa",
  "Shoko Takahashi",
  "Ai Uehara",
  "Yui Hatano",
  "Julia Kyoka",
  "Kana Momonogi",
  "Minami Aizawa",
  "Eimi Fukada",
];

const sampleVideos = [
  {
    title: "Big Buck Bunny",
    slug: "big-buck-bunny",
    embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    description:
      "A giant rabbit takes revenge on three bullying rodents in this classic open-source animated short.",
    tags: "animation,short film,open source",
    categorySlug: "movies",
    featured: true,
    trending: true,
  },
  {
    title: "Sintel",
    slug: "sintel",
    embedUrl: "https://www.youtube.com/embed/eRsGyueVLvQ",
    thumbnail: "https://i.ytimg.com/vi/eRsGyueVLvQ/hqdefault.jpg",
    description:
      "A lonely girl searches for a dragon she once rescued, in this acclaimed open-movie fantasy short.",
    tags: "animation,fantasy,open source",
    categorySlug: "movies",
    featured: true,
  },
  {
    title: "Tears of Steel",
    slug: "tears-of-steel",
    embedUrl: "https://www.youtube.com/embed/R6MlUcmOul8",
    thumbnail: "https://i.ytimg.com/vi/R6MlUcmOul8/hqdefault.jpg",
    description:
      "A group of warriors and scientists must fight rogue robots in a future Amsterdam.",
    tags: "sci-fi,short film,open source",
    categorySlug: "movies",
    trending: true,
  },
];

function uniqueBySlug<T extends { slug: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item.slug || seen.has(item.slug)) continue;
    seen.add(item.slug);
    out.push(item);
  }
  return out;
}

async function main() {
  const categories = uniqueBySlug(
    CATEGORY_NAMES.map((name, i) => {
      const slug = slugify(name) || `category-${i + 1}`;
      return {
        name,
        slug,
        icon: CAT_ICONS[slug] ?? "🎬",
        order: i + 1,
      };
    })
  );

  const performers = uniqueBySlug(
    PERFORMER_NAMES.map((name) => ({
      name,
      slug: slugify(name),
    })).filter((p) => p.slug.length > 1)
  );

  console.log(`Seeding ${categories.length} unique categories…`);
  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        order: c.order,
        enabled: true,
        // keep existing icon/image if admin customized
      },
      create: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        order: c.order,
        enabled: true,
      },
    });
  }

  console.log(`Seeding ${performers.length} unique performers…`);
  for (const p of performers) {
    const existing = await db.performer.findUnique({
      where: { slug: p.slug },
      select: { imageUrl: true },
    });
    await db.performer.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        enabled: true,
        // do not overwrite custom photos
      },
      create: {
        name: p.name,
        slug: p.slug,
        imageUrl: avatar(p.slug),
        enabled: true,
      },
    });
    // If somehow empty image on existing, fill placeholder
    if (existing && !existing.imageUrl.trim()) {
      await db.performer.update({
        where: { slug: p.slug },
        data: { imageUrl: avatar(p.slug) },
      });
    }
  }

  for (const v of sampleVideos) {
    const { categorySlug, ...data } = v;
    const category = await db.category.findUnique({
      where: { slug: categorySlug },
    });
    await db.video.upsert({
      where: { slug: v.slug },
      update: {},
      create: { ...data, categoryId: category?.id },
    });
  }

  // Backfill many-to-many from legacy single categoryId
  const linked = await db.video.findMany({
    where: { categoryId: { not: null } },
    select: { id: true, categoryId: true },
  });
  for (const v of linked) {
    if (v.categoryId == null) continue;
    await db.videoCategory.upsert({
      where: {
        videoId_categoryId: { videoId: v.id, categoryId: v.categoryId },
      },
      update: {},
      create: { videoId: v.id, categoryId: v.categoryId },
    });
  }

  const seoDefaults: [string, string][] = [
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
  for (const [key, value] of seoDefaults) {
    const existing = await db.setting.findUnique({ where: { key } });
    if (!existing?.value?.trim()) {
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
  }

  const [catCount, perfCount] = await Promise.all([
    db.category.count(),
    db.performer.count(),
  ]);
  console.log(
    `Seed complete. Catalog now: ${catCount} categories, ${perfCount} performers (duplicates skipped by slug).`
  );
  console.log(
    "Note: Names are curated Pornhub-style labels — not live-scraped (ToS). Edit anytime in Admin."
  );
}

main().finally(() => db.$disconnect());
