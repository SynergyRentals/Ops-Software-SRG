import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey, foreignKey, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "cleaner", "team"] }).notNull().default("team"),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Property model
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  nickname: text("nickname").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  address: text("address").notNull(),
  icalUrl: text("ical_url"),
  tags: text("tags").array(),
  beds: integer("beds"),
  baths: integer("baths"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Maintenance task model
export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  urgency: text("urgency", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).notNull().default("pending"),
  dueDate: timestamp("due_date"),
  source: text("source", { enum: ["manual", "hostai", "suiteop", "ai"] }).notNull().default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inventory item model
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  currentStock: integer("current_stock").notNull().default(0),
  threshold: integer("threshold").notNull().default(5),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Supply request model
export const supplyRequests = pgTable("supply_requests", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }).notNull(),
  requestedBy: integer("requested_by").references(() => users.id).notNull(),
  status: text("status", { enum: ["pending", "approved", "fulfilled", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Supply request items junction table
export const supplyRequestItems = pgTable("supply_request_items", {
  requestId: integer("request_id").references(() => supplyRequests.id, { onDelete: "cascade" }).notNull(),
  itemId: integer("item_id").references(() => inventoryItems.id, { onDelete: "cascade" }).notNull(),
  quantity: integer("quantity").notNull().default(1),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.requestId, table.itemId] }),
  };
});

// Webhook events model
export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  source: text("source", { enum: ["hostai", "suiteop"] }).notNull(),
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").notNull().default(false),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

// Create Zod schemas for inserting
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  name: true,
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  nickname: true,
  title: true,
  type: true,
  address: true,
  icalUrl: true,
  tags: true,
  beds: true,
  baths: true,
  imageUrl: true,
});

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).pick({
  title: true,
  description: true,
  propertyId: true,
  assignedTo: true,
  urgency: true,
  status: true,
  dueDate: true,
  source: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).pick({
  name: true,
  sku: true,
  currentStock: true,
  threshold: true,
  propertyId: true,
  category: true,
});

export const insertSupplyRequestSchema = createInsertSchema(supplyRequests).pick({
  propertyId: true,
  requestedBy: true,
  status: true,
});

export const insertSupplyRequestItemSchema = createInsertSchema(supplyRequestItems).pick({
  requestId: true,
  itemId: true,
  quantity: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).pick({
  source: true,
  payload: true,
  processed: true,
});

// Define types for the schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

export type InsertSupplyRequest = z.infer<typeof insertSupplyRequestSchema>;
export type SupplyRequest = typeof supplyRequests.$inferSelect;

export type InsertSupplyRequestItem = z.infer<typeof insertSupplyRequestItemSchema>;
export type SupplyRequestItem = typeof supplyRequestItems.$inferSelect;

export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;

// CSV Import Schema
export const propertyCsvSchema = z.object({
  nickname: z.string(),
  title: z.string(),
  type: z.string(),
  address: z.string(),
  icalUrl: z.string().optional(),
  tags: z.string().optional(),
  beds: z.number().optional(),
  baths: z.number().optional(),
});

export type PropertyCsvData = z.infer<typeof propertyCsvSchema>;
