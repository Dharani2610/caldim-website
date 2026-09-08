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
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGODB_DB_NAME || "caldim";
  const email = (process.argv[2] || "admin@caldimengg.com").toLowerCase().trim();
  const password = process.argv[3] || "CaldimAdmin2026!Secured";
  const name = "Caldim Administrator";

  console.log(`Connecting to MongoDB at ${uri}/${dbName}...`);
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
