import { MongoClient } from "mongodb";
import { hash, Algorithm } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";

try {
  process.loadEnvFile?.(".env");
} catch {
  // .env file loaded or skipped
}


const ARGON2 = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

function newId() {
  return Date.now().toString(36) + randomBytes(12).toString("hex");
}

async function main() {
  const uri = (process.env.MONGODB_URI || "mongodb://localhost:27017").trim();
  const dbName = process.env.MONGODB_DB_NAME || "caldim";
  
  const emailArg = process.argv[2]?.trim();
  if (!emailArg || emailArg.startsWith("--")) {
    console.error(`
================================================================================
  ERROR: MISSING TARGET EMAIL
================================================================================
  Usage:
    node scripts/temp-seed-mongo.mjs <email> [password] [--confirm-production]

  Example:
    node scripts/temp-seed-mongo.mjs test-user@example.com MyPass123!
================================================================================
`);
    process.exit(1);
  }

  const email = emailArg.toLowerCase();
  const password = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "CaldimAdmin2026!Secured";
  const name = "Caldim Administrator";

  const isAtlas = uri.startsWith("mongodb+srv://") || (!uri.includes("localhost") && !uri.includes("127.0.0.1"));
  const confirmedProd = process.argv.includes("--confirm-production") || process.argv.includes("--force");

  if (isAtlas && !confirmedProd) {
    console.error(`
================================================================================
  SAFETY REFUSAL: TARGETING REMOTE / ATLAS CLUSTER
================================================================================
  MONGODB_URI points to a remote/Atlas cluster:
  ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}

  Target account: ${email}

  To seed/overwrite accounts on Atlas intentionally, pass --confirm-production:
    node scripts/temp-seed-mongo.mjs ${email} [password] --confirm-production
================================================================================
`);
    process.exit(1);
  }

  console.log(`Connecting to MongoDB at ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}/${dbName}...`);
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Ensure indexes
  const adminUsers = db.collection("admin_users");
  const sessions = db.collection("sessions");
  const rateLimits = db.collection("rate_limits");
  const auditLogs = db.collection("audit_logs");

  await Promise.all([
    adminUsers.createIndex({ email: 1 }, { unique: true }),
    sessions.createIndex({ tokenHash: 1 }, { unique: true }),
    sessions.createIndex({ userId: 1 }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    rateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    auditLogs.createIndex({ createdAt: -1 }),
  ]);

  const passwordHash = await hash(password, ARGON2);
  const nowDate = new Date();

  await adminUsers.updateOne(
    { email },
    {
      $set: {
        email,
        name,
        passwordHash,
        role: "owner",
        mustChangePassword: true,
        disabled: false,
        totpSecret: null,
        totpEnabled: false,
        totpRecoveryHashes: null,
        failedAttempts: 0,
        lockedUntil: null,
        passwordChangedAt: nowDate,
        updatedAt: nowDate,
      },
      $setOnInsert: {
        _id: newId(),
        createdAt: nowDate,
      },
    },
    { upsert: true }
  );

  // Clear any existing sessions and rate limits for a clean test state
  const user = await adminUsers.findOne({ email });
  if (user) {
    await sessions.deleteMany({ userId: user._id });
  }
  await rateLimits.deleteMany({});


  console.log(`
────────────────────────────────────────────────────────────
 Test admin user seeded in MongoDB:
 Email:    ${email}
 Password: ${password}
 Database: ${dbName}
────────────────────────────────────────────────────────────
`);

  await client.close();
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
