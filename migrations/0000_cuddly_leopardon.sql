CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"threshold" integer DEFAULT 5 NOT NULL,
	"property_id" integer,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "maintenance_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"property_id" integer NOT NULL,
	"assigned_to" integer,
	"urgency" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"nickname" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"address" text NOT NULL,
	"ical_url" text,
	"tags" text[],
	"beds" integer,
	"baths" integer,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supply_request_items" (
	"request_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "supply_request_items_request_id_item_id_pk" PRIMARY KEY("request_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "supply_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"requested_by" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"name" text,
	"extension" varchar,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar,
	"listing_id" varchar,
	"listing_name" text,
	"action" text,
	"description" text,
	"source_type" varchar,
	"source_link" text,
	"guest_name" text,
	"guest_email" text,
	"guest_phone" text,
	"team_target" text DEFAULT 'internal' NOT NULL,
	"urgency" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"scheduled_for" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"raw_payload" jsonb NOT NULL,
	CONSTRAINT "tasks_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'team' NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_request_items" ADD CONSTRAINT "supply_request_items_request_id_supply_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."supply_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_request_items" ADD CONSTRAINT "supply_request_items_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_requests" ADD CONSTRAINT "supply_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_requests" ADD CONSTRAINT "supply_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;