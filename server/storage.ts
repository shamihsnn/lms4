import { type AdminUser, type InsertAdminUser, type Patient, type InsertPatient, type Test, type InsertTest, type IdChangeLog, type InsertIdChangeLog } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

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
  getNextPatientId(): Promise<string>;
  updatePatientId(id: number, newPatientId: string, adminId: number): Promise<void>;

  // Tests
  getTest(id: number): Promise<Test | undefined>;
  getTestByTestId(testId: string): Promise<Test | undefined>;
  getAllTests(): Promise<Test[]>;
  getTestsByPatient(patientId: number): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test>;
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
}

export class MemStorage implements IStorage {
  private adminUsers: Map<number, AdminUser>;
  private patients: Map<number, Patient>;
  private tests: Map<number, Test>;
  private idChangeLogs: Map<number, IdChangeLog>;
  private nextId: number;

  constructor() {
    this.adminUsers = new Map();
    this.patients = new Map();
    this.tests = new Map();
    this.idChangeLogs = new Map();
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

  async getNextPatientId(): Promise<string> {
    const patients = Array.from(this.patients.values());
    const maxNum = patients.reduce((max, patient) => {
      const match = patient.patientId.match(/PAT(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `PAT${String(maxNum + 1).padStart(3, '0')}`;
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

  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.nextId++;
    const test: Test = {
      ...insertTest,
      id,
      createdAt: new Date(),
      lastModified: new Date(),
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

  async getNextTestId(): Promise<string> {
    const tests = Array.from(this.tests.values());
    const maxNum = tests.reduce((max, test) => {
      const match = test.testId.match(/TEST(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `TEST${String(maxNum + 1).padStart(3, '0')}`;
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
}

export const storage = new MemStorage();
