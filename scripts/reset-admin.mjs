/**
 * Recovery tool: reset an admin password from the server console.
 *
 * This is the way back in when 2FA is lost and the recovery codes are gone.
 * It requires shell access to the machine holding the database, which is the
 * point — there is deliberately no "forgot password" endpoint on the site for
 * an attacker to work against.
 *
 *   npm run admin:reset -- admin@caldimengg.com
 *   npm run admin:reset -- admin@caldimengg.com --clear-2fa
 */
import { hash, Algorithm } from "@node-rs/argon2";
import { randomInt } from "node:crypto";
import { openDatabase, newId } from "./db.mjs";

const ARGON2 = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

function generatePassword() {
  const words = [
    "girder", "camber", "flange", "gusset", "purlin", "bracket", "anchor", "moment",
    "shear", "weld", "bolt", "plate", "column", "truss", "joist", "deck",
  ];
  const word = () => {
    const w = words[randomInt(words.length)];
    return w[0].toUpperCase() + w.slice(1);
  };
  return `${word()}-${word()}-${word()}-${randomInt(1000, 9999)}`;
}

async function main() {
  const email = (process.argv[2] ?? "").toLowerCase().trim();
  const clearTotp = process.argv.includes("--clear-2fa");

  if (!email) {
    console.error("\n  Usage: npm run admin:reset -- <email> [--clear-2fa]\n");
    process.exitCode = 1;
    return;
  }

  const sql = openDatabase();

  const [user] = await sql`SELECT id FROM admin_users WHERE email = ${email}`;
  if (!user) {
    console.error(`\n  No admin account found for ${email}\n`);
    process.exitCode = 1;
    await sql.end();
    return;
  }

  const password = generatePassword();
  const passwordHash = await hash(password, ARGON2);

  // The password reset, the session revocation and the audit entry are one
  // transaction: a reset that succeeded while leaving old sessions live would
  // be worse than one that failed outright.
  const revoked = await sql.begin(async (tx) => {
    if (clearTotp) {
      await tx`
        UPDATE admin_users
           SET password_hash = ${passwordHash}, must_change_password = true,
               failed_attempts = 0, locked_until = NULL,
               password_changed_at = now(), updated_at = now(),
               totp_enabled = false, totp_secret = NULL, totp_recovery_hashes = NULL
         WHERE id = ${user.id}`;
    } else {
      await tx`
        UPDATE admin_users
           SET password_hash = ${passwordHash}, must_change_password = true,
               failed_attempts = 0, locked_until = NULL,
               password_changed_at = now(), updated_at = now()
         WHERE id = ${user.id}`;
    }

    // Every existing session was authorised by the old credential.
    const rows = await tx`
      UPDATE sessions SET revoked_at = now()
       WHERE user_id = ${user.id} AND revoked_at IS NULL
       RETURNING id`;

    await tx`
      INSERT INTO audit_logs
        (id, action, user_id, actor_info, entity, entity_id, outcome, meta, created_at)
      VALUES (${newId()}, 'password.changed', ${user.id}, ${`console reset (${email})`},
              'AdminUser', ${user.id}, 'success',
              ${sql.json({ via: "cli", clearedTotp: clearTotp, revokedSessions: rows.length })},
              now())`;

    return rows.length;
  });

  console.log(`
  ────────────────────────────────────────────────────────────
   Password reset for ${email}

   New password      ${password}
   Sessions revoked  ${revoked}
   Two-factor        ${clearTotp ? "cleared — re-enrol at next sign-in" : "unchanged"}

   Change it immediately after signing in.
  ────────────────────────────────────────────────────────────
`);

  await sql.end();
}

main().catch((error) => {
  console.error("\n  Reset failed:\n", error, "\n");
  process.exitCode = 1;
});
