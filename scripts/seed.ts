/**
 * scripts/seed.ts
 *
 * Development seed script. Inserts baseline categories and example posts.
 * Run with: pnpm db:seed
 *
 * Requirements:
 * - POSTGRES_URL must be set in .env.local
 * - Migrations must have been applied first (pnpm db:migrate)
 * - Safe to run multiple times — uses onConflictDoNothing()
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "../db/schema";
import {
  posts,
  categories,
  postCategories,
} from "../db/schema";

// ── Bootstrap DB client (bypasses db/client.ts which throws on missing env) ──

if (!process.env.POSTGRES_URL) {
  console.error("❌  POSTGRES_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

const client = postgres(process.env.POSTGRES_URL, { max: 1, ssl: "require" });
const db = drizzle(client, { schema });

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_CATEGORIES: schema.NewCategory[] = [
  {
    name: "Travel",
    slug: "travel",
    description: "Itineraries, slow travel, and notes from the road.",
    display_order: 1,
  },
  {
    name: "Reading",
    slug: "reading",
    description: "Structured reflections on books worth sitting with.",
    display_order: 2,
  },
  {
    name: "Essays",
    slug: "essays",
    description: "Personal essays on habits, attention, and craft.",
    display_order: 3,
  },
];

const SEED_POSTS: schema.NewPost[] = [
  {
    title: "เกียวโตในฤดูใบไม้ร่วง: การเดินทางแบบช้าๆ",
    slug: "kyoto-in-autumn",
    type: "travel",
    excerpt:
      "สิบเอ็ดวันที่ใช้ชีวิตในจังหวะของใบไม้ร่วง — สวนวัด ร้านกาแฟซอกเล็ก และวินัยของการทำน้อยลง",
    content_json: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "เกียวโตในเดือนพฤศจิกายนไม่ใช่เรื่องของการท่องเที่ยว แต่เป็นเรื่องของการอยู่",
            },
          ],
        },
      ],
    },
    content_html:
      "<p>เกียวโตในเดือนพฤศจิกายนไม่ใช่เรื่องของการท่องเที่ยว แต่เป็นเรื่องของการอยู่</p>",
    status: "draft",
    featured_order: 1,
    reading_time_minutes: 9,
    seo_title: "เกียวโตในฤดูใบไม้ร่วง — บันทึกการเดินทาง",
    seo_description:
      "สิบเอ็ดวันในเกียวโตช่วงฤดูใบไม้ร่วง: วัด ร้านกาแฟ และการเรียนรู้ที่จะทำน้อยลง",
  },
  {
    title: "Atomic Habits — บันทึกการอ่าน",
    slug: "atomic-habits-reading-notes",
    type: "reading",
    excerpt:
      "แนวคิดเดียวที่คุ้มค่าจากหนังสือของ James Clear และสามอย่างที่ผมไม่เห็นด้วยอย่างเงียบๆ",
    content_json: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "หนังสือที่ดีไม่ใช่หนังสือที่คุณเห็นด้วยทุกบรรทัด",
            },
          ],
        },
      ],
    },
    content_html:
      "<p>หนังสือที่ดีไม่ใช่หนังสือที่คุณเห็นด้วยทุกบรรทัด</p>",
    status: "draft",
    reading_time_minutes: 6,
    seo_title: "Atomic Habits — บันทึกการอ่านและความคิดเห็น",
    seo_description:
      "สิ่งที่ได้จากการอ่าน Atomic Habits ของ James Clear และมุมมองที่แตกต่าง",
  },
];

// ── Seeding logic ─────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱  Seeding database…\n");

  // 1. Categories
  console.log("  → Inserting categories…");
  const insertedCategories = await db
    .insert(categories)
    .values(SEED_CATEGORIES)
    .onConflictDoNothing({ target: categories.slug })
    .returning();

  console.log(`     ✓ ${insertedCategories.length} categories inserted (skipped existing)\n`);

  // 2. Posts
  console.log("  → Inserting posts…");
  const insertedPosts = await db
    .insert(posts)
    .values(SEED_POSTS)
    .onConflictDoNothing({ target: posts.slug })
    .returning();

  console.log(`     ✓ ${insertedPosts.length} posts inserted (skipped existing)\n`);

  // 3. Post ↔ Category relationships
  if (insertedPosts.length > 0) {
    console.log("  → Linking posts to categories…");

    // Re-fetch all categories to get their IDs (seed may have skipped inserts)
    const allCategories = await db.select().from(categories);
    const categoryBySlug = Object.fromEntries(
      allCategories.map((c) => [c.slug, c]),
    );

    const links: schema.NewPostCategory[] = [];

    for (const post of insertedPosts) {
      if (post.type === "travel" && categoryBySlug["travel"]) {
        links.push({ post_id: post.id, category_id: categoryBySlug["travel"].id });
      }
      if (post.type === "reading" && categoryBySlug["reading"]) {
        links.push({ post_id: post.id, category_id: categoryBySlug["reading"].id });
      }
      if (post.type === "essay" && categoryBySlug["essays"]) {
        links.push({ post_id: post.id, category_id: categoryBySlug["essays"].id });
      }
    }

    if (links.length > 0) {
      await db.insert(postCategories).values(links).onConflictDoNothing();
      console.log(`     ✓ ${links.length} post-category links created\n`);
    }
  }

  console.log("✅  Seed complete.\n");
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
