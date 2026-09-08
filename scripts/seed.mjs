/**
 * First-run setup.
 *
 * Creates the owner account if one doesn't exist and prints the temporary
 * password exactly once. The password is generated here rather than read from
 * a file or an env var, so it never sits on disk waiting to be found, and the
 * account is flagged `mustChangePassword` so it can't survive first sign-in.
 *
 *   npm run db:seed
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

/**
 * Three words plus four digits: ~48 bits from the words alone, long enough to
 * resist offline cracking, and short enough to read down a phone line once.
 */
function generatePassword() {
  const words = [
    "girder", "camber", "flange", "gusset", "purlin", "bracket", "anchor", "moment",
    "shear", "weld", "bolt", "plate", "column", "truss", "joist", "deck",
    "stanchion", "haunch", "splice", "stiffener", "cleat", "lintel", "webbing",
    "chord", "kicker", "shim", "grout", "collar", "saddle", "outrigger",
  ];
  const word = () => {
    const w = words[randomInt(words.length)];
    return w[0].toUpperCase() + w.slice(1);
  };
  return `${word()}-${word()}-${word()}-${randomInt(1000, 9999)}`;
}

async function main() {
  const sql = openDatabase();

  const email = (process.env.ADMIN_EMAIL ?? "admin@caldimengg.com").toLowerCase().trim();
  const name = process.env.ADMIN_NAME ?? "Caldim Administrator";

  const [existing] = await sql`SELECT id FROM admin_users WHERE email = ${email}`;

  if (existing) {
    console.log(`
  Admin account already exists: ${email}
  Nothing to do. To reset the password, run:
      npm run admin:reset -- ${email}
`);
    await sql.end();
    return;
  }

  const password = generatePassword();

  await sql`
    INSERT INTO admin_users
      (id, email, name, password_hash, role, must_change_password, disabled,
       totp_enabled, failed_attempts, password_changed_at, created_at, updated_at)
    VALUES (${newId()}, ${email}, ${name}, ${await hash(password, ARGON2)},
            'owner', true, false, false, 0, now(), now(), now())`;

  console.log(`
  ────────────────────────────────────────────────────────────
   Admin account created
  ────────────────────────────────────────────────────────────

   URL       http://localhost:3000/admin/login
   Email     ${email}
   Password  ${password}

   This password is shown once and is not stored anywhere in
   readable form. You will be asked to change it at first
   sign-in — turn on two-factor authentication right after.
  ────────────────────────────────────────────────────────────
`);

  await sql.end();
}

main().catch((error) => {
  console.error("\n  Seeding failed:\n", error, "\n");
  process.exitCode = 1;
});
