/**
 * Database schema. Phase 3 covers identity, permissions, sessions, audit, schools
 * (for role scoping) and website enquiries. Later phases add their own tables
 * (students and registrations in Phase 4, exams in 5, results in 6, finance and
 * messaging in 7) through new migrations.
 */
import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  date,
  index,
  inet,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ---------------------------------------------------------------- Identity */

export const userStatus = pgEnum("user_status", ["active", "disabled", "pending"]);
export const userKind = pgEnum("user_kind", ["staff", "school", "student", "parent"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null for student accounts, which sign in with their student ID. */
    email: varchar("email", { length: 254 }),
    /** Student accounts sign in with this (their student ID, e.g. EEA-S-100245). */
    username: varchar("username", { length: 24 }).unique(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    kind: userKind("kind").notNull(),
    status: userStatus("status").notNull().default("active"),
    passwordHash: text("password_hash"),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    totpSecretEnc: text("totp_secret_enc"),
    totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true }),
    /** Last accepted TOTP time step, so a code cannot be reused. */
    totpLastStep: integer("totp_last_step"),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    /** For student accounts: the student record this login belongs to. */
    studentId: uuid("student_id"),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`), uniqueIndex("users_student_idx").on(t.studentId)],
);

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull().default(""),
  /** System roles cannot be deleted; their permissions can still be edited (except Super Administrator). */
  isSystem: boolean("is_system").notNull().default(false),
  /** Scope a role assignment can be limited to. */
  scope: varchar("scope", { length: 20 }).notNull().default("global"), // global | school | self
  ...timestamps,
});

export const permissions = pgTable("permissions", {
  key: varchar("key", { length: 64 }).primaryKey(),
  module: varchar("module", { length: 40 }).notNull(),
  description: text("description").notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionKey: varchar("permission_key", { length: 64 })
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionKey] })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    /** Set when the role applies to one school only (School Coordinator, Teacher). */
    schoolId: uuid("school_id").references(() => schools.id, { onDelete: "cascade" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("user_roles_user_idx").on(t.userId), uniqueIndex("user_roles_unique_idx").on(t.userId, t.roleId, t.schoolId)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the cookie token. The raw token is never stored. */
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mfaVerified: boolean("mfa_verified").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamps.createdAt,
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

/* ----------------------------------------------------------------- Schools */

export const schoolStatus = pgEnum("school_status", ["pending", "approved", "rejected", "suspended"]);

export const schools = pgTable(
  "schools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Issued on approval, e.g. EEA-LHR-00421. */
    code: varchar("code", { length: 24 }).unique(),
    name: varchar("name", { length: 200 }).notNull(),
    principalName: varchar("principal_name", { length: 120 }).notNull(),
    officialEmail: varchar("official_email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 80 }).notNull(),
    country: varchar("country", { length: 2 }).notNull().default("PK"),
    status: schoolStatus("status").notNull().default("pending"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("schools_city_idx").on(t.city), index("schools_status_idx").on(t.status)],
);

export const campuses = pgTable("campuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 80 }),
  ...timestamps,
});

/* ------------------------------------------------------------------- Audit */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 40 }),
    entityId: varchar("entity_id", { length: 64 }),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("audit_created_idx").on(t.createdAt), index("audit_actor_idx").on(t.actorUserId), index("audit_entity_idx").on(t.entityType, t.entityId)],
);

/* ------------------------------------------------------------ Rate limiting */

/** Fixed-window counters. Moves to Redis when the platform scales out. */
export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 200 }).primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});

/* ---------------------------------------------------------------- Website */

export const enquiryStatus = pgEnum("enquiry_status", ["new", "in_progress", "closed"]);

export const contactEnquiries = pgTable(
  "contact_enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    audience: varchar("audience", { length: 20 }).notNull(), // parent | school | student | other
    subject: varchar("subject", { length: 160 }).notNull(),
    message: text("message").notNull(),
    status: enquiryStatus("status").notNull().default("new"),
    ip: inet("ip"),
    ...timestamps,
  },
  (t) => [index("enquiries_status_idx").on(t.status, t.createdAt)],
);

/* ------------------------------------------------------------ Competitions */

export const competitionStatus = pgEnum("competition_status", ["draft", "published", "archived"]);
export const competitionKind = pgEnum("competition_kind", ["olympiad", "activity"]);

export type CompetitionContent = {
  overview?: string;
  objectives?: string[];
  eligibility?: string[];
  format?: { label: string; value: string }[];
  syllabus?: { band: string; topics: string[] }[];
  rules?: string[];
  awards?: { title: string; detail: string }[];
  faqs?: { q: string; a: string }[];
};

export const competitions = pgTable(
  "competitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 8 }).notNull().unique(),
    kind: competitionKind("kind").notNull().default("olympiad"),
    accent: varchar("accent", { length: 12 }).notNull().default("blue"),
    icon: varchar("icon", { length: 16 }).notNull().default("book"),
    summary: varchar("summary", { length: 240 }).notNull().default(""),
    /** 0 = KG. Null until EEA sets it; registration stays closed meanwhile. */
    gradeFrom: smallint("grade_from"),
    gradeTo: smallint("grade_to"),
    modes: text("modes").array().notNull().default(sql`ARRAY['online','paper']::text[]`),
    levels: smallint("levels").notNull().default(1),
    durationMinutes: smallint("duration_minutes"),
    feePkr: integer("fee_pkr"),
    registrationCloses: date("registration_closes"),
    examDate: date("exam_date"),
    status: competitionStatus("status").notNull().default("draft"),
    sortOrder: smallint("sort_order").notNull().default(0),
    content: jsonb("content").$type<CompetitionContent>().notNull().default({}),
    ...timestamps,
  },
  (t) => [index("competitions_status_idx").on(t.status)],
);

/* ---------------------------------------------------------------- Students */

export const studentCodeSeq = pgSequence("student_code_seq", { startWith: 100001 });
export const schoolCodeSeq = pgSequence("school_code_seq", { startWith: 101 });
export const registrationRefSeq = pgSequence("registration_ref_seq", { startWith: 100001 });

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null for students entered individually by a parent. */
    schoolId: uuid("school_id").references(() => schools.id, { onDelete: "restrict" }),
    campusId: uuid("campus_id").references(() => campuses.id, { onDelete: "set null" }),
    /** For individual entrants: the school they attend, as typed by the parent. */
    schoolName: varchar("school_name", { length: 200 }),
    /** For individual entrants: the parent account that added them. */
    addedByGuardian: uuid("added_by_guardian").references(() => users.id, { onDelete: "set null" }),
    /** Public student ID, e.g. EEA-S-100245. */
    code: varchar("code", { length: 16 }).notNull().unique(),
    firstName: varchar("first_name", { length: 60 }).notNull(),
    lastName: varchar("last_name", { length: 60 }).notNull(),
    gender: varchar("gender", { length: 8 }),
    dateOfBirth: date("date_of_birth").notNull(),
    grade: smallint("grade").notNull(),
    section: varchar("section", { length: 20 }),
    guardianName: varchar("guardian_name", { length: 120 }).notNull(),
    guardianPhone: varchar("guardian_phone", { length: 20 }).notNull(),
    guardianEmail: varchar("guardian_email", { length: 254 }),
    archived: boolean("archived").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("students_school_grade_idx").on(t.schoolId, t.grade),
    // Duplicate guard: same school, same name, same date of birth.
    uniqueIndex("students_dedupe_idx").on(t.schoolId, sql`lower(${t.firstName})`, sql`lower(${t.lastName})`, t.dateOfBirth),
    uniqueIndex("students_individual_dedupe_idx")
      .on(t.addedByGuardian, sql`lower(${t.firstName})`, sql`lower(${t.lastName})`, t.dateOfBirth)
      .where(sql`${t.schoolId} is null`),
  ],
);

/** Parents linked to students (a parent can have several children, a child several parents). */
export const studentGuardians = pgTable(
  "student_guardians",
  {
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    relationship: varchar("relationship", { length: 20 }).notNull().default("parent"),
    linkedVia: varchar("linked_via", { length: 20 }).notNull(), // added | claimed
    createdAt: timestamps.createdAt,
  },
  (t) => [primaryKey({ columns: [t.studentId, t.userId] }), index("student_guardians_user_idx").on(t.userId)],
);

export const bulkImports = pgTable("bulk_imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  fileName: varchar("file_name", { length: 200 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("previewed"), // previewed | imported | cancelled
  totalRows: integer("total_rows").notNull().default(0),
  validRows: integer("valid_rows").notNull().default(0),
  errorRows: integer("error_rows").notNull().default(0),
  duplicateRows: integer("duplicate_rows").notNull().default(0),
  importedRows: integer("imported_rows").notNull().default(0),
  createdAt: timestamps.createdAt,
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const importRows = pgTable(
  "import_rows",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    importId: uuid("import_id")
      .notNull()
      .references(() => bulkImports.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    data: jsonb("data").$type<Record<string, string | number | null>>().notNull(),
    errors: jsonb("errors").$type<string[]>().notNull().default([]),
    status: varchar("status", { length: 12 }).notNull(), // valid | error | duplicate | imported
    studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
  },
  (t) => [index("import_rows_import_idx").on(t.importId, t.rowNumber)],
);

/* ----------------------------------------------------------- Registrations */

export const registrationStatus = pgEnum("registration_status", ["pending_payment", "confirmed", "cancelled"]);

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** e.g. REG-2027-100245 */
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    /** Set for school registrations. */
    schoolId: uuid("school_id").references(() => schools.id, { onDelete: "restrict" }),
    /** Set for individual registrations made by a parent. */
    guardianUserId: uuid("guardian_user_id").references(() => users.id, { onDelete: "restrict" }),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "restrict" }),
    mode: varchar("mode", { length: 8 }).notNull(), // online | paper
    status: registrationStatus("status").notNull().default("pending_payment"),
    feePkr: integer("fee_pkr").notNull(),
    studentCount: integer("student_count").notNull(),
    totalPkr: integer("total_pkr").notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("registrations_school_idx").on(t.schoolId),
    index("registrations_guardian_idx").on(t.guardianUserId),
    index("registrations_competition_idx").on(t.competitionId),
    check("registrations_payer_check", sql`(${t.schoolId} is null) <> (${t.guardianUserId} is null)`),
  ],
);

export const registrationItems = pgTable(
  "registration_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "restrict" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    grade: smallint("grade").notNull(),
  },
  // A student can be registered for a competition only once.
  (t) => [uniqueIndex("registration_items_unique_idx").on(t.competitionId, t.studentId)],
);

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
