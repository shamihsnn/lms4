import { eq, desc, and, gte } from "drizzle-orm";
import { db } from "./database";
import { adminUsers, patients, tests, idChangeLog, type AdminUser, type InsertAdminUser, type Patient, type InsertPatient, type Test, type InsertTest, type IdChangeLog, type InsertIdChangeLog } from "@shared/schema";
import bcrypt from "bcryptjs";
import type { IStorage } from "./storage";

export class SupabaseStorage implements IStorage {
  private isConnected: boolean = false;

  constructor() {
    this.initializeDefaultAdmin();
  }

  private async initializeDefaultAdmin(): Promise<void> {
    try {
      // Test connection first
      await this.testConnection();
      
      // Check if default admin already exists
      const existingAdmin = await this.getAdminUserByUsername("admin");
      if (existingAdmin) {
        return;
      }

      // Create default admin user
      const passwordHash = await bcrypt.hash("admin123", 10);
      await db.insert(adminUsers).values({
        username: "admin",
        passwordHash,
      });
      console.log("✅ Default admin user created successfully");
    } catch (error) {
      console.error("❌ Error initializing default admin:", error);
      console.log("🔄 Application will continue with limited functionality");
    }
  }

  private async testConnection(): Promise<void> {
    try {
      // Simple connection test
      await db.select().from(adminUsers).limit(1);
      this.isConnected = true;
      console.log("✅ Database connection successful");
    } catch (error) {
      this.isConnected = false;
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }

  private throwIfNotConnected(): void {
    if (!this.isConnected) {
      throw new Error("Database connection is not available. Please check your database configuration.");
    }
  }

  // Admin users
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    this.throwIfNotConnected();
    const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
    return result[0];
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    this.throwIfNotConnected();
    const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
    return result[0];
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const result = await db.insert(adminUsers).values(user).returning();
    return result[0];
  }

  async updateAdminUserPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(adminUsers)
      .set({ 
        passwordHash, 
        passwordChangedAt: new Date() 
      })
      .where(eq(adminUsers.id, id));
  }

  async updateLastLogin(id: number): Promise<void> {
    await db.update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id));
  }

  // Patients
  async getPatient(id: number): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    return result[0];
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.patientId, patientId)).limit(1);
    return result[0];
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients).values(patient).returning();
    return result[0];
  }

  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient> {
    const result = await db.update(patients)
      .set({ 
        ...patient, 
        lastModified: new Date() 
      })
      .where(eq(patients.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Patient not found");
    }
    return result[0];
  }

  async getNextPatientId(): Promise<string> {
    const result = await db.select({ patientId: patients.patientId })
      .from(patients)
      .orderBy(desc(patients.id))
      .limit(1);

    if (result.length === 0) {
      return "PAT001";
    }

    const lastId = result[0].patientId;
    const match = lastId.match(/PAT(\d+)/);
    const nextNum = match ? parseInt(match[1]) + 1 : 1;
    return `PAT${String(nextNum).padStart(3, '0')}`;
  }

  async updatePatientId(id: number, newPatientId: string, adminId: number): Promise<void> {
    // Check if patient exists
    const patient = await this.getPatient(id);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Check if new ID already exists
    const existing = await this.getPatientByPatientId(newPatientId);
    if (existing && existing.id !== id) {
      throw new Error("Patient ID already exists");
    }

    const oldId = patient.patientId;

    // Update patient ID
    await db.update(patients)
      .set({ 
        patientId: newPatientId, 
        lastModified: new Date(),
        modifiedBy: adminId 
      })
      .where(eq(patients.id, id));

    // Create audit log
    await this.createIdChangeLog({
      tableName: "patients",
      recordId: id,
      oldId,
      newId: newPatientId,
      changedBy: adminId,
      reason: "Admin ID change",
    });
  }

  // Tests
  async getTest(id: number): Promise<Test | undefined> {
    const result = await db.select().from(tests).where(eq(tests.id, id)).limit(1);
    return result[0];
  }

  async getTestByTestId(testId: string): Promise<Test | undefined> {
    const result = await db.select().from(tests).where(eq(tests.testId, testId)).limit(1);
    return result[0];
  }

  async getAllTests(): Promise<Test[]> {
    return await db.select().from(tests).orderBy(desc(tests.createdAt));
  }

  async getTestsByPatient(patientId: number): Promise<Test[]> {
    return await db.select().from(tests).where(eq(tests.patientId, patientId)).orderBy(desc(tests.createdAt));
  }

  async getAllTestsWithPatients(): Promise<(Test & { patient?: Patient })[]> {
    const result = await db.select({
      // Test fields
      id: tests.id,
      testId: tests.testId,
      patientId: tests.patientId,
      testType: tests.testType,
      testResults: tests.testResults,
      normalRanges: tests.normalRanges,
      flags: tests.flags,
      testDate: tests.testDate,
      testTime: tests.testTime,
      status: tests.status,
      performedBy: tests.performedBy,
      createdAt: tests.createdAt,
      lastModified: tests.lastModified,
      modifiedBy: tests.modifiedBy,
      // Patient fields
      patient: {
        id: patients.id,
        patientId: patients.patientId,
        name: patients.name,
        age: patients.age,
        gender: patients.gender,
        phone: patients.phone,
        address: patients.address,
        createdAt: patients.createdAt,
        createdBy: patients.createdBy,
        lastModified: patients.lastModified,
        modifiedBy: patients.modifiedBy,
      }
    })
    .from(tests)
    .leftJoin(patients, eq(tests.patientId, patients.id))
    .orderBy(desc(tests.createdAt));

    return result.map(row => ({
      id: row.id,
      testId: row.testId,
      patientId: row.patientId,
      testType: row.testType,
      testResults: row.testResults,
      normalRanges: row.normalRanges,
      flags: row.flags,
      testDate: row.testDate,
      testTime: row.testTime,
      status: row.status,
      performedBy: row.performedBy,
      createdAt: row.createdAt,
      lastModified: row.lastModified,
      modifiedBy: row.modifiedBy,
      patient: row.patient.id ? row.patient : undefined,
    }));
  }

  async createTest(test: InsertTest): Promise<Test> {
    const result = await db.insert(tests).values(test).returning();
    return result[0];
  }

  async updateTest(id: number, test: Partial<InsertTest>): Promise<Test> {
    const result = await db.update(tests)
      .set({ 
        ...test, 
        lastModified: new Date() 
      })
      .where(eq(tests.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Test not found");
    }
    return result[0];
  }

  async getNextTestId(): Promise<string> {
    const result = await db.select({ testId: tests.testId })
      .from(tests)
      .orderBy(desc(tests.id))
      .limit(1);

    if (result.length === 0) {
      return "TEST001";
    }

    const lastId = result[0].testId;
    const match = lastId.match(/TEST(\d+)/);
    const nextNum = match ? parseInt(match[1]) + 1 : 1;
    return `TEST${String(nextNum).padStart(3, '0')}`;
  }

  async updateTestId(id: number, newTestId: string, adminId: number): Promise<void> {
    // Check if test exists
    const test = await this.getTest(id);
    if (!test) {
      throw new Error("Test not found");
    }

    // Check if new ID already exists
    const existing = await this.getTestByTestId(newTestId);
    if (existing && existing.id !== id) {
      throw new Error("Test ID already exists");
    }

    const oldId = test.testId;

    // Update test ID
    await db.update(tests)
      .set({ 
        testId: newTestId, 
        lastModified: new Date(),
        modifiedBy: adminId 
      })
      .where(eq(tests.id, id));

    // Create audit log
    await this.createIdChangeLog({
      tableName: "tests",
      recordId: id,
      oldId,
      newId: newTestId,
      changedBy: adminId,
      reason: "Admin ID change",
    });
  }

  // Audit log
  async createIdChangeLog(log: InsertIdChangeLog): Promise<IdChangeLog> {
    const result = await db.insert(idChangeLog).values(log).returning();
    return result[0];
  }

  async getIdChangeLogs(): Promise<IdChangeLog[]> {
    return await db.select().from(idChangeLog).orderBy(desc(idChangeLog.changedAt));
  }

  // Stats
  async getTodayTestsCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: tests.id })
      .from(tests)
      .where(gte(tests.createdAt, today));
    
    return result.length;
  }

  async getTotalPatientsCount(): Promise<number> {
    const result = await db.select({ count: patients.id }).from(patients);
    return result.length;
  }

  async getPendingReportsCount(): Promise<number> {
    const result = await db.select({ count: tests.id })
      .from(tests)
      .where(eq(tests.status, "pending"));
    
    return result.length;
  }

  async getCriticalResultsCount(): Promise<number> {
    // This query looks for tests where any flag value is "CRITICAL"
    // Since flags is JSONB, we need to check if any value contains "CRITICAL"
    const allTests = await db.select().from(tests);
    
    let criticalCount = 0;
    for (const test of allTests) {
      if (test.flags) {
        const flags = test.flags as any;
        if (typeof flags === 'object' && Object.values(flags).some((flag: any) => flag === "CRITICAL")) {
          criticalCount++;
        }
      }
    }
    
    return criticalCount;
  }
}
