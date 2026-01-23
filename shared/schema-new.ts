import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// CPF validation function
function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

export const cpfSchema = z.string()
  .min(11, "CPF deve ter 11 dígitos")
  .refine(validateCPF, { message: "CPF inválido" });

// ================== CORE TABLES ==================

// Users table (professors, admins, etc.)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  cpf: text("cpf").unique().notNull(),
  nome: text("nome"),
  sobrenome: text("sobrenome"),
  telefone: text("telefone").unique().notNull(),
  email: text("email"),
  verificado: boolean("verificado").default(false),
  plano: text("plano"),
  role: text("role"), // 'aluno', 'professor', 'colaborador', 'doador', 'patrocinador', 'conselheiro'
  
  // Professor-specific fields
  formacao: text("formacao"),
  especializacao: text("especializacao"),
  experiencia: text("experiencia"),
  disciplinas: text("disciplinas"),
  
  // Council approval
  conselhoStatus: text("conselho_status").default("pendente"),
  conselhoApprovedBy: text("conselho_approved_by"),
  conselhoApprovedAt: timestamp("conselho_approved_at"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Students table - Simplified and optimized
export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  cpf: text("cpf").unique().notNull(),
  fullName: text("full_name").notNull(),
  birthDate: date("birth_date").notNull(),
  gender: text("gender"), // M, F, Outro
  
  // Contact info
  phone: text("phone"),
  email: text("email"),
  
  // Address (simplified)
  address: text("address"), // Complete address as text
  zipCode: text("zip_code"),
  city: text("city"),
  state: text("state"),
  
  // Family (essential only)
  responsibleName: text("responsible_name").notNull(),
  responsibleCpf: text("responsible_cpf").notNull(),
  responsiblePhone: text("responsible_phone").notNull(),
  responsibleRelation: text("responsible_relation"), // pai, mae, responsavel
  
  // School info
  currentGrade: text("current_grade"),
  previousSchool: text("previous_school"),
  
  // Health (basic)
  hasSpecialNeeds: boolean("has_special_needs").default(false),
  specialNeedsNotes: text("special_needs_notes"),
  hasAllergies: boolean("has_allergies").default(false),
  allergiesNotes: text("allergies_notes"),
  
  // System
  professorId: integer("professor_id").references(() => users.id).notNull(),
  status: text("status").default("active"), // active, inactive, transferred
  enrollmentDate: date("enrollment_date").defaultNow(),
  notes: text("notes"), // General observations
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classes/Turmas - Streamlined
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject"), // Disciplina principal
  grade: text("grade"), // Serie/ano
  
  // Professor
  professorId: integer("professor_id").references(() => users.id).notNull(),
  
  // Capacity and schedule
  maxStudents: integer("max_students").default(30),
  currentStudents: integer("current_students").default(0),
  
  // Period
  startDate: date("start_date"),
  endDate: date("end_date"),
  
  // Schedule (simplified as JSON text)
  weekSchedule: text("week_schedule"), // JSON: {"monday": "08:00-10:00", "wednesday": "14:00-16:00"}
  classroom: text("classroom"),
  
  // Status
  status: text("status").default("active"), // active, completed, cancelled
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student-Class enrollment (many-to-many)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  status: text("status").default("active"), // active, dropped, completed
  finalGrade: decimal("final_grade", { precision: 4, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ================== ACADEMIC MANAGEMENT ==================

// Lessons - What was actually taught
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  professorId: integer("professor_id").references(() => users.id).notNull(),
  
  // Lesson details
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  
  // Content
  topics: text("topics").array(), // Array of topics covered
  materials: text("materials"), // Materials used
  homework: text("homework"), // Homework assigned
  
  // Status
  status: text("status").default("completed"), // planned, completed, cancelled
  studentsPresent: integer("students_present").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance - Simplified
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  
  status: text("status").notNull(), // present, absent, late, justified
  notes: text("notes"),
  
  recordedAt: timestamp("recorded_at").defaultNow(),
  recordedBy: integer("recorded_by").references(() => users.id).notNull(),
});

// Student Progress & Observations
export const studentProgress = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  professorId: integer("professor_id").references(() => users.id).notNull(),
  
  // Assessment
  skillArea: text("skill_area").notNull(), // math, reading, behavior, etc.
  currentLevel: text("current_level"), // beginner, intermediate, advanced
  progressNotes: text("progress_notes").notNull(),
  
  // Goals and recommendations
  goals: text("goals"),
  recommendations: text("recommendations"),
  
  // Dates
  assessmentDate: date("assessment_date").notNull(),
  nextReviewDate: date("next_review_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ================== CALENDAR & EVENTS ==================

// Events - Simplified calendar system
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").references(() => users.id).notNull(),
  
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // class, meeting, exam, holiday, reminder
  
  // Date/Time
  date: date("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  isAllDay: boolean("is_all_day").default(false),
  
  // Optional associations
  classId: integer("class_id").references(() => classes.id),
  studentId: uuid("student_id").references(() => students.id),
  
  // Reminders
  hasReminder: boolean("has_reminder").default(false),
  reminderMinutes: integer("reminder_minutes").default(15),
  
  // Recurrence (simple)
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"), // weekly, monthly, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================== COMMUNICATION ==================

// Messages/Notes between professor and students/parents
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromId: integer("from_id").references(() => users.id).notNull(),
  toType: text("to_type").notNull(), // student, parent, class
  toId: text("to_id").notNull(), // student ID, parent phone, class ID
  
  subject: text("subject"),
  content: text("content").notNull(),
  type: text("type").default("general"), // general, behavior, academic, reminder
  priority: text("priority").default("normal"), // low, normal, high, urgent
  
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ================== RELATIONS ==================

export const usersRelations = relations(users, ({ many }) => ({
  classes: many(classes),
  lessons: many(lessons),
  events: many(events),
  studentsSupervised: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  professor: one(users, {
    fields: [students.professorId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  attendance: many(attendance),
  progress: many(studentProgress),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  professor: one(users, {
    fields: [classes.professorId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  lessons: many(lessons),
  events: many(events),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  class: one(classes, {
    fields: [lessons.classId],
    references: [classes.id],
  }),
  professor: one(users, {
    fields: [lessons.professorId],
    references: [users.id],
  }),
  attendance: many(attendance),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [enrollments.classId],
    references: [classes.id],
  }),
}));

// ================== INSERT SCHEMAS ==================

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  cpf: cpfSchema,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  cpf: cpfSchema,
  responsibleCpf: cpfSchema,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  recordedAt: true,
});

export const insertProgressSchema = createInsertSchema(studentProgress).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// ================== TYPE INFERENCE ==================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Council Request table (keeping from original)
export const councilRequests = pgTable("council_requests", {
  id: serial("id").primaryKey(),
  telefone: text("telefone").notNull(),
  nome: text("nome"),
  status: text("status").default("pending"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: text("processed_by"),
});

export const insertCouncilRequestSchema = createInsertSchema(councilRequests).pick({
  telefone: true,
  nome: true,
});

export type CouncilRequest = typeof councilRequests.$inferSelect;
export type InsertCouncilRequest = z.infer<typeof insertCouncilRequestSchema>;