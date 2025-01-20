import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Create role enum
export const userRoleEnum = pgEnum("user_role", ["admin", "agent", "customer"]);

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table with role and org relationship
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organization invites table
export const organizationInvites = pgTable("organization_invites", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  token: text("token").unique().notNull(),
  accepted: boolean("accepted").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  invites: many(organizationInvites),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationInvitesRelations = relations(organizationInvites, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvites.organizationId],
    references: [organizations.id],
  }),
}));

// Create Zod schemas for validation
export const insertOrganizationSchema = createInsertSchema(organizations);
export const selectOrganizationSchema = createSelectSchema(organizations);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertOrganizationInviteSchema = createInsertSchema(organizationInvites);
export const selectOrganizationInviteSchema = createSelectSchema(organizationInvites);

// Export types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type OrganizationInvite = typeof organizationInvites.$inferSelect;
export type InsertOrganizationInvite = typeof organizationInvites.$inferInsert;