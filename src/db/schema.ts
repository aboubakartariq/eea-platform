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
  index,
  inet,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
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
    email: varchar("email", { length: 254 }).notNull(),
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
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
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

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
