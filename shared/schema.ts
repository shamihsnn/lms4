import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, serial, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin Users Table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  passwordChangedAt: timestamp("password_changed_at").defaultNow(),
});

// Patients Table
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: varchar("patient_id", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  age: integer("age"),
  gender: varchar("gender", { length: 10 }),
  phone: varchar("phone", { length: 15 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => adminUsers.id),
  lastModified: timestamp("last_modified").defaultNow(),
  modifiedBy: integer("modified_by").references(() => adminUsers.id),
});

// Tests Table
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  testId: varchar("test_id", { length: 20 }).notNull().unique(),
  patientId: integer("patient_id").references(() => patients.id),
  testType: varchar("test_type", { length: 50 }).notNull(),
  testResults: jsonb("test_results").notNull(),
  normalRanges: jsonb("normal_ranges").notNull(),
  flags: jsonb("flags"), // HIGH/LOW/NORMAL/CRITICAL flags
  testDate: date("test_date").defaultNow(),
  testTime: time("test_time").defaultNow(),
  status: varchar("status", { length: 20 }).default("completed"),
  performedBy: integer("performed_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  lastModified: timestamp("last_modified").defaultNow(),
  modifiedBy: integer("modified_by").references(() => adminUsers.id),
});

// ID Change Audit Log Table
export const idChangeLog = pgTable("id_change_log", {
  id: serial("id").primaryKey(),
  tableName: varchar("table_name", { length: 20 }).notNull(),
  recordId: integer("record_id").notNull(),
  oldId: varchar("old_id", { length: 20 }).notNull(),
  newId: varchar("new_id", { length: 20 }).notNull(),
  changedBy: integer("changed_by").references(() => adminUsers.id),
  changedAt: timestamp("changed_at").defaultNow(),
  reason: text("reason"),
});

// Test Templates Table
export const testTemplates = pgTable("test_templates", {
  id: serial("id").primaryKey(),
  testType: varchar("test_type", { length: 50 }).notNull(),
  parameters: jsonb("parameters").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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

// Types
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export type InsertIdChangeLog = z.infer<typeof insertIdChangeLogSchema>;
export type IdChangeLog = typeof idChangeLog.$inferSelect;

export type InsertTestTemplate = z.infer<typeof insertTestTemplateSchema>;
export type TestTemplate = typeof testTemplates.$inferSelect;

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
