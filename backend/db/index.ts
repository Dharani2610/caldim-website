import "server-only";
import { randomBytes } from "node:crypto";
import { MongoClient, type Db, type Collection } from "mongodb";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/backend/env";
import * as schema from "@/backend/db/schema";

export * from "@/backend/db/schema";

// ─── MongoDB Document Type Definitions ──────────────────────────────────────

export interface AdminUserDoc {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "owner" | "editor";
  mustChangePassword: boolean;
  disabled: boolean;
  totpSecret?: string | null;
  totpEnabled: boolean;
  totpRecoveryHashes?: string[] | null;
  failedAttempts: number;
  lockedUntil?: Date | null;
  lastLoginAt?: Date | null;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDoc {
  _id: string;
  tokenHash: string;
  userId: string;
  fullyAuthenticated: boolean;
  ipHash?: string | null;
  userAgent?: string | null;
  lastSeenAt: Date;
  absoluteExpiresAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

export function toAdminUser(doc: AdminUserDoc): AdminUserDoc & { id: string } {
  return { ...doc, id: doc._id };
}

export function toSession(doc: SessionDoc): SessionDoc & { id: string } {
  return { ...doc, id: doc._id };
}

export type AdminUser = AdminUserDoc & { id: string };
export type Session = SessionDoc & { id: string };


export interface ContentBlockDoc {
  _id: string; // The block key (e.g., "hero", "services")
  value: unknown;
  updatedById?: string | null;
  updatedAt: Date;
  createdAt: Date;
}


export interface MediaAssetDoc {
  _id: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
  format: string;
  secureUrl: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  checksum: string;
  altText: string;
  title: string;
  uploadedById?: string | null;
  createdAt: Date;
}

export interface LeaderDoc {
  _id: string;
  name: string;
  title: string;
  credentials: string;
  bio: string;
  education?: string | null;
  experience?: string | null;
  highlights?: string[] | null;
  location: string;
  email?: string | null;
  linkedinUrl?: string | null;
  photoId?: string | null;
  initials: string;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GalleryItemDoc {
  _id: string;
  collection: string; // e.g. "gallery", "projects", "shopfloor", "certificates"
  mediaId: string;
  caption: string;
  meta: string;
  posterId?: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogDoc {
  _id: string;
  userId?: string | null;
  actorInfo: string;
  action: string;
  entity: string;
  entityId: string;
  outcome: "success" | "failure";
  ipHash?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface RateLimitDoc {
  _id: string; // The rate limit key
  count: number;
  windowStart: Date;
  blockedUntil?: Date | null;
  expiresAt: Date; // TTL index target
  updatedAt: Date;
}

export interface ContactSubmissionDoc {
  _id: string;
  name: string;
  company: string;
  email: string;
  role: string;
  projectType: string;
  tonnage: string;
  timeline: string;
  message: string;
  attachmentId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  handled: boolean;
  createdAt: Date;
}

// ─── Connection Layer ───────────────────────────────────────────────────────

const globalForMongo = globalThis as unknown as {
  __caldimMongoClient?: MongoClient;
  __caldimMongoDb?: Db;
  __caldimSql?: ReturnType<typeof postgres>;
  __caldimDb?: ReturnType<typeof createClient>;
};

export class DatabaseNotConfigured extends Error {
  constructor() {
    super(
      "MONGODB_URI is not configured. Set MONGODB_URI in .env to connect to MongoDB."
    );
    this.name = "DatabaseNotConfigured";
  }
}

/**
 * Checks whether MongoDB or legacy Postgres is configured with a valid connection string.
 * Allows the application to gracefully degrade when no database is configured.
 */
export function isDatabaseConfigured(): boolean {
  const uri = env.mongodbUri;
  const dbUrl = env.databaseUrl;
  const isMongoValid = Boolean(
    uri &&
      (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) &&
      uri.trim() !== "mongodb://unconfigured" &&
      uri.length >= 10
  );
  const isPostgresValid = Boolean(
    dbUrl &&
      !dbUrl.includes("aws-0-REGION") &&
      !dbUrl.includes("PROJECT") &&
      !dbUrl.includes("PASSWORD")
  );
  return isMongoValid || isPostgresValid;
}

/**
 * Returns the connected MongoClient singleton instance.
 */
export async function getMongoClient(): Promise<MongoClient> {
  const uri = env.mongodbUri;
  if (!uri) throw new DatabaseNotConfigured();

  if (globalForMongo.__caldimMongoClient) {
    return globalForMongo.__caldimMongoClient;
  }

  const client = new MongoClient(uri, {
    maxPoolSize: env.databasePoolMax || 10,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  globalForMongo.__caldimMongoClient = client;
  return client;
}

/**
 * Returns the active MongoDB database instance.
 */
export async function getMongoDb(): Promise<Db> {
  if (globalForMongo.__caldimMongoDb) {
    return globalForMongo.__caldimMongoDb;
  }

  const client = await getMongoClient();
  const db = client.db(env.mongodbDbName || "caldim");
  globalForMongo.__caldimMongoDb = db;
  return db;
}

// ─── Collection Getters ─────────────────────────────────────────────────────

export async function getAdminUsersCollection(): Promise<Collection<AdminUserDoc>> {
  const db = await getMongoDb();
  return db.collection<AdminUserDoc>("admin_users");
}

export async function getSessionsCollection(): Promise<Collection<SessionDoc>> {
  const db = await getMongoDb();
  return db.collection<SessionDoc>("sessions");
}

export async function getContentBlocksCollection(): Promise<Collection<ContentBlockDoc>> {
  const db = await getMongoDb();
  return db.collection<ContentBlockDoc>("content_blocks");
}

export async function getMediaAssetsCollection(): Promise<Collection<MediaAssetDoc>> {
  const db = await getMongoDb();
  return db.collection<MediaAssetDoc>("media_assets");
}

export async function getLeadersCollection(): Promise<Collection<LeaderDoc>> {
  const db = await getMongoDb();
  return db.collection<LeaderDoc>("leaders");
}

export async function getGalleryItemsCollection(): Promise<Collection<GalleryItemDoc>> {
  const db = await getMongoDb();
  return db.collection<GalleryItemDoc>("gallery_items");
}

export async function getAuditLogsCollection(): Promise<Collection<AuditLogDoc>> {
  const db = await getMongoDb();
  return db.collection<AuditLogDoc>("audit_logs");
}

export async function getRateLimitsCollection(): Promise<Collection<RateLimitDoc>> {
  const db = await getMongoDb();
  return db.collection<RateLimitDoc>("rate_limits");
}

export async function getContactSubmissionsCollection(): Promise<Collection<ContactSubmissionDoc>> {
  const db = await getMongoDb();
  return db.collection<ContactSubmissionDoc>("contact_submissions");
}

/**
 * Initializes all required unique, compound, and TTL indexes idempotently.
 */
export async function ensureMongoIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("admin_users").createIndex({ email: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ userId: 1 }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("media_assets").createIndex({ publicId: 1 }, { unique: true }),
    db.collection("media_assets").createIndex({ checksum: 1 }),
    db.collection("media_assets").createIndex({ resourceType: 1 }),
    db.collection("leaders").createIndex({ sortOrder: 1 }),
    db.collection("leaders").createIndex({ published: 1, sortOrder: 1 }),
    db.collection("gallery_items").createIndex({ collection: 1, sortOrder: 1 }),
    db.collection("gallery_items").createIndex({ mediaId: 1 }),
    db.collection("audit_logs").createIndex({ createdAt: -1 }),
    db.collection("audit_logs").createIndex({ action: 1 }),
    db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("contact_submissions").createIndex({ createdAt: -1 }),
    db.collection("contact_submissions").createIndex({ handled: 1, createdAt: -1 }),
  ]);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Collision-resistant, sortable ID using timestamp prefix + random hex bytes.
 */
export function newId(): string {
  return Date.now().toString(36) + randomBytes(12).toString("hex");
}

export async function one<T>(query: PromiseLike<T[]>): Promise<T | undefined> {
  const rows = await query;
  return rows[0];
}

// ─── Legacy Postgres/Drizzle Handle for Multi-Phase Transition ───────────────

function createSql() {
  if (!env.databaseUrl) {
    return postgres("postgres://postgres:postgres@localhost:5432/caldim_unconfigured", {
      max: 1,
      connect_timeout: 1,
      onnotice: () => undefined,
    });
  }

  return postgres(env.databaseUrl, {
    ssl: env.databaseSsl ? "require" : undefined,
    max: env.databasePoolMax,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => undefined,
  });
}

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

function createClient(): DbClient {
  const sql = globalForMongo.__caldimSql ?? createSql();
  globalForMongo.__caldimSql = sql;
  return drizzle(sql, { schema });
}

function resolveDb(): DbClient {
  if (!env.databaseUrl) {
    throw new DatabaseNotConfigured();
  }
  if (!globalForMongo.__caldimDb) globalForMongo.__caldimDb = createClient();
  return globalForMongo.__caldimDb;
}

export const db = new Proxy({} as DbClient, {
  get(_target, property) {
    const client = resolveDb() as unknown as Record<string | symbol, unknown>;
    const value = client[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

