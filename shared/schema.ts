import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// NOTE: SQLite schema. Use text/integer types and store JSON as text with runtime parsing.

// Admin Users Table
export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  lastLogin: text("last_login"),
  passwordChangedAt: text("password_changed_at").default(sql`CURRENT_TIMESTAMP`),
});

// Patients Table
export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  phone: text("phone"),
  address: text("address"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer("created_by").references(() => adminUsers.id),
  lastModified: text("last_modified").default(sql`CURRENT_TIMESTAMP`),
  modifiedBy: integer("modified_by").references(() => adminUsers.id),
});

// Tests Table
export const tests = sqliteTable("tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: text("test_id").notNull().unique(),
  patientId: integer("patient_id").references(() => patients.id),
  testType: text("test_type").notNull(),
  // Store JSON as TEXT, typed as any for TS
  testResults: text("test_results").$type<any>().notNull(),
  normalRanges: text("normal_ranges").$type<any>().notNull(),
  flags: text("flags").$type<any>(), // HIGH/LOW/NORMAL/CRITICAL flags
  testDate: text("test_date").default(sql`DATE('now')`),
  testTime: text("test_time").default(sql`TIME('now')`),
  status: text("status").default("completed"),
  performedBy: integer("performed_by").references(() => adminUsers.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  lastModified: text("last_modified").default(sql`CURRENT_TIMESTAMP`),
  modifiedBy: integer("modified_by").references(() => adminUsers.id),
});

// ID Change Audit Log Table
export const idChangeLog = sqliteTable("id_change_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableName: text("table_name").notNull(),
  recordId: integer("record_id").notNull(),
  oldId: text("old_id").notNull(),
  newId: text("new_id").notNull(),
  changedBy: integer("changed_by").references(() => adminUsers.id),
  changedAt: text("changed_at").default(sql`CURRENT_TIMESTAMP`),
  reason: text("reason"),
});

// Test Templates Table
export const testTemplates = sqliteTable("test_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testType: text("test_type").notNull(),
  parameters: text("parameters").$type<any>().notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
  passwordChangedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  lastModified: true,
});

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
  lastModified: true,
});

export const insertIdChangeLogSchema = createInsertSchema(idChangeLog).omit({
  id: true,
  changedAt: true,
});

export const insertTestTemplateSchema = createInsertSchema(testTemplates).omit({
  id: true,
  createdAt: true,
});

// API payload schemas (DB stores JSON as TEXT in SQLite)
export const insertTestPayloadSchema = z.object({
  testId: z.string(),
  patientId: z.number().nullable().optional(),
  testType: z.string(),
  testResults: z.record(z.any()),
  normalRanges: z.record(z.any()),
  flags: z.record(z.any()).nullable().optional(),
  status: z.string().optional(),
  testDate: z.string().nullable().optional(),
  testTime: z.string().nullable().optional(),
  performedBy: z.number().nullable().optional(),
  modifiedBy: z.number().nullable().optional(),
});

export const insertTestTemplatePayloadSchema = z.object({
  testType: z.string(),
  parameters: z.record(z.any()),
});

// Types
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// IMPORTANT: Many client pages still import InsertTest for request payloads.
// To maintain compatibility after the SQLite migration (where payloads are
// plain JSON objects), alias InsertTest to the payload schema so existing
// imports continue to type-check without changing each page.
export type InsertTest = z.infer<typeof insertTestPayloadSchema>;
export type Test = typeof tests.$inferSelect;

export type InsertIdChangeLog = z.infer<typeof insertIdChangeLogSchema>;
export type IdChangeLog = typeof idChangeLog.$inferSelect;

export type InsertTestTemplate = z.infer<typeof insertTestTemplateSchema>;
export type TestTemplate = typeof testTemplates.$inferSelect;

export type InsertTestPayload = z.infer<typeof insertTestPayloadSchema>;
export type InsertTestTemplatePayload = z.infer<typeof insertTestTemplatePayloadSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
