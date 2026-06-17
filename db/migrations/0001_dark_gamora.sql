ALTER TABLE "posts" ADD COLUMN "draft_content_json" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "draft_saved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "cover_image" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "featured_order" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "cover_image_url";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "featured";--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_featured_order_unique" UNIQUE("featured_order");