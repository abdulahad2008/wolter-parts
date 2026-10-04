CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "buy_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"sku" text NOT NULL,
	"size" text DEFAULT '' NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"kind" text NOT NULL,
	"group_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ru" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category_id" integer,
	"price" integer NOT NULL,
	"old_price" integer,
	"stock" text DEFAULT 'in' NOT NULL,
	"badge" text DEFAULT '' NOT NULL,
	"sizes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"tg_mode" text DEFAULT 'manager' NOT NULL,
	"tg_manager" text DEFAULT 'wolteruz' NOT NULL,
	"tg_bot" text DEFAULT '' NOT NULL,
	"template" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"landmark" text DEFAULT '' NOT NULL,
	"hours" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"map_url" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buy_clicks" ADD CONSTRAINT "buy_clicks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buy_clicks_created_idx" ON "buy_clicks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "buy_clicks_product_idx" ON "buy_clicks" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "buy_clicks_group_idx" ON "buy_clicks" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "products_position_idx" ON "products" USING btree ("position");