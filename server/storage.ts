import { type AdminUser, type InsertAdminUser, type Patient, type InsertPatient, type Test, type InsertTest, type IdChangeLog, type InsertIdChangeLog, type TestTemplate, type InsertTestTemplate } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Admin users
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUserPassword(id: number, passwordHash: string): Promise<void>;
  updateLastLogin(id: number): Promise<void>;

  // Patients
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient>;
  deletePatient(id: number): Promise<void>;
  getNextPatientId(): Promise<string>;
  updatePatientId(id: number, newPatientId: string, adminId: number): Promise<void>;

  // Tests
  getTest(id: number): Promise<Test | undefined>;
  getTestByTestId(testId: string): Promise<Test | undefined>;
  getAllTests(): Promise<Test[]>;
  getTestsByPatient(patientId: number): Promise<Test[]>;
  getAllTestsWithPatients(): Promise<(Test & { patient?: Patient })[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test>;
  deleteTest(id: number): Promise<void>;
  getNextTestId(): Promise<string>;
  updateTestId(id: number, newTestId: string, adminId: number): Promise<void>;

  // Audit log
  createIdChangeLog(log: InsertIdChangeLog): Promise<IdChangeLog>;
  getIdChangeLogs(): Promise<IdChangeLog[]>;

  // Stats
  getTodayTestsCount(): Promise<number>;
  getTotalPatientsCount(): Promise<number>;
  getPendingReportsCount(): Promise<number>;
  getCriticalResultsCount(): Promise<number>;

  // Test templates
  getAllTestTemplates(): Promise<TestTemplate[]>;
  getTestTemplateByType(testType: string): Promise<TestTemplate | undefined>;
  upsertTestTemplate(template: InsertTestTemplate): Promise<TestTemplate>;
}

export class MemStorage implements IStorage {
  private adminUsers: Map<number, AdminUser>;
  private patients: Map<number, Patient>;
  private tests: Map<number, Test>;
  private idChangeLogs: Map<number, IdChangeLog>;
  private testTemplates: Map<number, TestTemplate>;
  private testTemplatesByType: Map<string, number>;
  private nextId: number;

  constructor() {
    this.adminUsers = new Map();
    this.patients = new Map();
    this.tests = new Map();
    this.idChangeLogs = new Map();
    this.testTemplates = new Map();
    this.testTemplatesByType = new Map();
    this.nextId = 1;

    // Create default admin user
    this.initializeDefaultAdmin();
  }

  private async initializeDefaultAdmin(): Promise<void> {
    const passwordHash = await bcrypt.hash("admin123", 10);
    const admin: AdminUser = {
      id: 1,
      username: "admin",
      passwordHash,
      createdAt: new Date(),
      lastLogin: null,
      passwordChangedAt: new Date(),
    };
    this.adminUsers.set(1, admin);
    this.nextId = 2;
  }

  // Admin users
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    return this.adminUsers.get(id);
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    return Array.from(this.adminUsers.values()).find(user => user.username === username);
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const id = this.nextId++;
    const user: AdminUser = {
      ...insertUser,
      id,
      createdAt: new Date(),
      lastLogin: null,
      passwordChangedAt: new Date(),
    };
    this.adminUsers.set(id, user);
    return user;
  }

  async updateAdminUserPassword(id: number, passwordHash: string): Promise<void> {
    const user = this.adminUsers.get(id);
    if (user) {
      user.passwordHash = passwordHash;
      user.passwordChangedAt = new Date();
      this.adminUsers.set(id, user);
    }
  }

  async updateLastLogin(id: number): Promise<void> {
    const user = this.adminUsers.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.adminUsers.set(id, user);
    }
  }

  // Patients
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(patient => patient.patientId === patientId);
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.nextId++;
    const patient: Patient = {
      ...insertPatient,
      id,
      createdAt: new Date(),
      lastModified: new Date(),
      address: insertPatient.address ?? null,
      age: insertPatient.age ?? null,
      gender: insertPatient.gender ?? null,
      phone: insertPatient.phone ?? null,
      createdBy: insertPatient.createdBy ?? null,
      modifiedBy: insertPatient.modifiedBy ?? null,
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, updateData: Partial<InsertPatient>): Promise<Patient> {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new Error("Patient not found");
    }
    const updated: Patient = {
      ...patient,
      ...updateData,
      lastModified: new Date(),
    };
    this.patients.set(id, updated);
    return updated;
  }

  async deletePatient(id: number): Promise<void> {
    // Prevent deleting a patient with associated tests
    const hasTests = Array.from(this.tests.values()).some(
      (test) => test.patientId === id,
    );
    if (hasTests) {
      throw new Error("Cannot delete patient with existing test reports");
    }
    this.patients.delete(id);
  }

  async getNextPatientId(): Promise<string> {
    const now = new Date();
    const year = String(now.getFullYear());
    const prefix = `PAT-${year}-`;
    let maxSeq = 0;
    for (const p of this.patients.values()) {
      const pid = p.patientId || "";
      if (pid.startsWith(prefix)) {
        const tail = pid.slice(prefix.length);
        const m = tail.match(/^(\d{4})$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxSeq) maxSeq = n;
        }
      }
    }
    const next = String(maxSeq + 1).padStart(4, '0');
    return `${prefix}${next}`;
  }

  async updatePatientId(id: number, newPatientId: string, adminId: number): Promise<void> {
    const patient = this.patients.get(id);
    if (!patient) {
      throw new Error("Patient not found");
    }
    
    // Check if new ID already exists
    const existing = await this.getPatientByPatientId(newPatientId);
    if (existing && existing.id !== id) {
      throw new Error("Patient ID already exists");
    }

    const oldId = patient.patientId;
    patient.patientId = newPatientId;
    patient.lastModified = new Date();
    patient.modifiedBy = adminId;
    this.patients.set(id, patient);

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
    return this.tests.get(id);
  }

  async getTestByTestId(testId: string): Promise<Test | undefined> {
    return Array.from(this.tests.values()).find(test => test.testId === testId);
  }

  async getAllTests(): Promise<Test[]> {
    return Array.from(this.tests.values());
  }

  async getTestsByPatient(patientId: number): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(test => test.patientId === patientId);
  }

  async getAllTestsWithPatients(): Promise<(Test & { patient?: Patient })[]> {
    const allTests = Array.from(this.tests.values());
    return Promise.all(allTests.map(async test => {
      const patient = test.patientId ? await this.getPatient(test.patientId) : undefined;
      return { ...test, patient };
    }));
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.nextId++;
    const test: Test = {
      ...insertTest,
      id,
      createdAt: new Date(),
      lastModified: new Date(),
      status: insertTest.status ?? null,
      patientId: insertTest.patientId ?? null,
      flags: insertTest.flags ?? null,
      testDate: insertTest.testDate ?? null,
      testTime: insertTest.testTime ?? null,
      performedBy: insertTest.performedBy ?? null,
      modifiedBy: insertTest.modifiedBy ?? null,
    };
    this.tests.set(id, test);
    return test;
  }

  async updateTest(id: number, updateData: Partial<InsertTest>): Promise<Test> {
    const test = this.tests.get(id);
    if (!test) {
      throw new Error("Test not found");
    }
    const updated: Test = {
      ...test,
      ...updateData,
      lastModified: new Date(),
    };
    this.tests.set(id, updated);
    return updated;
  }

  async deleteTest(id: number): Promise<void> {
    this.tests.delete(id);
  }

  async getNextTestId(): Promise<string> {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `TST-${yyyy}${mm}-`;
    let maxSeq = 0;
    for (const t of this.tests.values()) {
      const tid = t.testId || "";
      if (tid.startsWith(prefix)) {
        const tail = tid.slice(prefix.length);
        const m = tail.match(/^(\d{4})$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxSeq) maxSeq = n;
        }
      }
    }
    const next = String(maxSeq + 1).padStart(4, '0');
    return `${prefix}${next}`;
  }

  async updateTestId(id: number, newTestId: string, adminId: number): Promise<void> {
    const test = this.tests.get(id);
    if (!test) {
      throw new Error("Test not found");
    }
    
    // Check if new ID already exists
    const existing = await this.getTestByTestId(newTestId);
    if (existing && existing.id !== id) {
      throw new Error("Test ID already exists");
    }

    const oldId = test.testId;
    test.testId = newTestId;
    test.lastModified = new Date();
    test.modifiedBy = adminId;
    this.tests.set(id, test);

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
  async createIdChangeLog(insertLog: InsertIdChangeLog): Promise<IdChangeLog> {
    const id = this.nextId++;
    const log: IdChangeLog = {
      ...insertLog,
      id,
      changedAt: new Date(),
      changedBy: insertLog.changedBy ?? null,
      reason: insertLog.reason ?? null,
    };
    this.idChangeLogs.set(id, log);
    return log;
  }

  async getIdChangeLogs(): Promise<IdChangeLog[]> {
    return Array.from(this.idChangeLogs.values());
  }

  // Stats
  async getTodayTestsCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(this.tests.values()).filter(test => {
      const testDate = new Date(test.createdAt!);
      testDate.setHours(0, 0, 0, 0);
      return testDate.getTime() === today.getTime();
    }).length;
  }

  async getTotalPatientsCount(): Promise<number> {
    return this.patients.size;
  }

  async getPendingReportsCount(): Promise<number> {
    return Array.from(this.tests.values()).filter(test => test.status === "pending").length;
  }

  async getCriticalResultsCount(): Promise<number> {
    return Array.from(this.tests.values()).filter(test => {
      const flags = test.flags as any;
      return flags && Object.values(flags).some((flag: any) => flag === "CRITICAL");
    }).length;
  }

  // Test templates
  async getAllTestTemplates(): Promise<TestTemplate[]> {
    return Array.from(this.testTemplates.values());
  }

  async getTestTemplateByType(testType: string): Promise<TestTemplate | undefined> {
    const id = this.testTemplatesByType.get(testType);
    if (id === undefined) return undefined;
    return this.testTemplates.get(id);
  }

  async upsertTestTemplate(insertTemplate: InsertTestTemplate): Promise<TestTemplate> {
    const existingId = this.testTemplatesByType.get(insertTemplate.testType);
    if (existingId !== undefined) {
      const existing = this.testTemplates.get(existingId);
      const updated: TestTemplate = {
        ...existing!,
        ...insertTemplate,
      } as TestTemplate;
      this.testTemplates.set(existingId, updated);
      return updated;
    }
    const id = this.nextId++;
    const template: TestTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date(),
    } as TestTemplate;
    this.testTemplates.set(id, template);
    this.testTemplatesByType.set(template.testType, id);
    return template;
  }
}

export const storage = new MemStorage();
