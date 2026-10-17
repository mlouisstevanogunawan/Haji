#!/usr/bin/env node
/**
 * Seed akun demo ke Supabase Auth + tabel profiles.
 *
 * Dipakai sekali (atau berulang, sifatnya idempoten) supaya login memakai
 * Supabase Auth asli bisa dicoba untuk kelima peran. Akun yang emailnya sudah
 * ada tidak dibuat ulang dan kata sandinya tidak ditimpa.
 *
 *   node scripts/seed-demo-accounts.mjs
 *   DEMO_PASSWORD=rahasiaLain node scripts/seed-demo-accounts.mjs
 *
 * Memerlukan SUPABASE_SERVICE_ROLE_KEY di .env.local (hanya dipakai di sisi
 * server; tidak pernah dikirim ke browser).
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(process.cwd());
const ENV_FILE = path.join(ROOT, ".env.local");

if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.DEMO_PASSWORD || "DemoUmroh2026!";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Gagal: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus ada di .env.local."
  );
  process.exit(1);
}

const ADMIN = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin`;
const AUTH_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Panggil GoTrue admin API langsung. SDK versi lama tidak menyediakan
 * getUserByEmail dan tidak meneruskan `id`, padahal kita butuh id custom agar
 * akun login memakai UUID baris profiles yang sudah ada.
 */
async function authRequest(method, pathname, body) {
  let res;
  try {
    res = await fetch(`${ADMIN}${pathname}`, {
      method,
      headers: AUTH_HEADERS,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    // Gangguan jaringan/TLS lokal (proxy yang menukar sertifikat) menampakkan
    // diri sebagai "fetch failed" tanpa pesan yang berguna.
    throw new Error(
      `${method} ${pathname} tidak sampai ke Supabase Auth: ${err.message}` +
        (err.cause?.code ? ` (${err.cause.code})` : "") +
        ". Jika mesin memakai proxy HTTPS yang mengganti sertifikat, tambahkan CA proxy " +
        "lewat NODE_EXTRA_CA_CERTS lalu jalankan ulang."
    );
  }
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`${method} ${pathname} -> ${res.status}: ${json.message || text.slice(0, 200)}`);
  }
  return json;
}

/**
 * profileId diisi UUID baris profiles yang sudah ada di data contoh, sehingga
 * akun login langsung-warisi booking/tagihan/dokumen jamaah, agen, dan muthawif
 * yang sudah ada. Bila kosong, baris profiles dibuat/tautkan lewat email.
 */
const ACCOUNTS = [
  {
    email: "superadmin@almadinah.id",
    fullName: "Ustadz Al-Hafidz",
    role: "super_admin",
    branchCode: "JKT",
  },
  {
    email: "admin.cabang@almadinah.id",
    fullName: "Rizky Darmawan",
    role: "admin_cabang",
    branchCode: "JKT",
  },
  {
    email: "agen@example.com",
    fullName: "Hasan Basri (Mitra Agen)",
    role: "mitra_agen",
    branchCode: "JKT",
    profileId: "22222222-2222-2222-2222-222222222202",
  },
  {
    email: "muthawif@example.com",
    fullName: "Ustadz Abdullah (Muthawif)",
    role: "muthawif",
    branchCode: "JKT",
    profileId: "33333333-3333-3333-3333-333333333301",
  },
  {
    email: "jamaah@example.com",
    fullName: "Ahmad Fauzi",
    role: "jamaah",
    branchCode: "JKT",
    profileId: "11111111-1111-1111-1111-111111111104",
  },
];

/**
 * Endpoint LIST (/users?page=..) sengaja tidak dipakai: di proyek yang query
 * admin-nya rusak (500 "Database error finding users") listing-lah yang gagal,
 * sedangkan lookup per email/per id dan INSERT tetap jalan.
 */
function isAuthDbError(message) {
  return /database error|unexpected_failure|internal server error|\b500\b/i.test(message);
}

function adminReadBroken(email, err) {
  console.warn(
    `   endpoint baca admin rusak untuk ${email} (${err.message}). ` +
      `Script lanjut mencoba membuat akun langsung; bila INSERT juga 500, jalankan ` +
      `supabase/migrations/20261017_fix_auth_admin_users_500.sql di SQL Editor lalu ulangi ` +
      `(alternatif: supabase/seed-demo-auth-users.sql).`
  );
}

async function profileIdForEmail(email) {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return data?.id ?? null;
}

async function findUserByEmail(account) {
  let readBroke = null;

  if (account.profileId) {
    try {
      const user = await authRequest("GET", `/users/${account.profileId}`);
      if (user?.id) return user;
    } catch (err) {
      if (isAuthDbError(err.message)) readBroke = err;
    }
  }

  try {
    const json = await authRequest(
      "GET",
      `/users?email=${encodeURIComponent(account.email)}&create=false`
    );
    const user = json?.user ?? (json?.id ? json : null);
    if (user?.id) return user;
  } catch (err) {
    if (isAuthDbError(err.message)) readBroke = readBroke || err;
  }

  if (readBroke) {
    adminReadBroken(account.email, readBroke);
    // Penanda "tidak tahu": caller akan mencoba INSERT dulu dan menafsirkan
    // balasan 'already exists' sebagai bukti akun sudah ada.
    return { unknown: true };
  }

  return null;
}

/** Id milik akun yang sudah ada tetapi tidak bisa dibaca lewat endpoint admin. */
async function resolveExistingId(account) {
  if (account.profileId) return account.profileId;
  return await profileIdForEmail(account.email);
}

async function branchIdByCode(code) {
  if (!code) return null;
  const { data } = await admin
    .from("branches")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  return data?.id ?? null;
}

async function createAuthUser(account) {
  const body = {
    email: account.email,
    password: PASSWORD,
    email_confirm: true,
    data: { full_name: account.fullName, role: account.role },
  };
  if (account.profileId) body.id = account.profileId;

  try {
    const user = await authRequest("POST", "/users", body);
    return user;
  } catch (err) {
    if (!account.profileId) throw err;
    if (/already exists|has already been created/i.test(err.message)) throw err;

    // Id custom ditolak. Memakai UUID dari GoTrue di sini akan meninggalkan dua
    // baris profil (lama punya booking, baru kosong), jadi lebih baik berhenti.
    throw new Error(
      `Supabase Auth menolak id custom ${account.profileId} untuk ${account.email} (${err.message}). ` +
        `Buat akun ini di Dashboard Supabase (Authentication > Users > Add user) dengan email tersebut, ` +
        `lalu jalankan script lagi: profileId lama akan ditautkan ke id akun baru.`
    );
  }
}

async function syncProfile(user, account, branchId) {
  const payload = {
    email: account.email,
    full_name: account.fullName,
    role: account.role,
    is_active: true,
  };
  if (branchId) payload.branch_id = branchId;

  // Baris profiles untuk data contoh biasanya sudah ada dengan UUID yang sama,
  // jadi cukup diperbarui. Insert hanya untuk akun yang benar-benar baru.
  const byId = await admin
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (!byId.error && byId.data) return user.id;

  const byEmail = await admin
    .from("profiles")
    .select("id")
    .eq("email", account.email)
    .maybeSingle();

  if (byEmail.data?.id) {
    // Baris lama punya id berbeda. Memindahkannya berarti menghapus baris
    // bookings/invoices yang mengacu padanya (FK on delete cascade), jadi
    // jangan disentuh: cukup beri tahu operator.
    console.warn(
      `   profiles '${account.email}' sudah ada dengan id ${byEmail.data.id} ` +
        `sedangkan akun login memakai ${user.id}. Jalankan script dengan profileId ` +
        `di isi data contoh agar keduanya sama.`
    );
    return byEmail.data.id;
  }

  const inserted = await admin
    .from("profiles")
    .insert({ ...payload, id: user.id })
    .select("id")
    .single();
  if (inserted.error) throw new Error(`profiles: ${inserted.error.message}`);
  return inserted.data.id;
}

/** Tautkan data master (guides/agents) ke akun login agar portal mereka berisi. */
async function linkMasterData(table, profileId, email) {
  const { error } = await admin.from(table).update({ user_id: profileId }).eq("email", email);
  if (error) console.warn(`   ${table}: ${error.message}`);
}

async function main() {
  console.log("Seed akun demo Supabase Auth\n");

  for (const account of ACCOUNTS) {
    const branchId = await branchIdByCode(account.branchCode);

    // Tanpa profileId eksplisit pun, baris profiles yang sudah ada menentukan
    // UUID akun login: dibuat dengan id yang sama, sehingga booking/tagihan/
    // dokumen lama ikut terpaut ke akun baru ini.
    if (!account.profileId) {
      account.profileId = await profileIdForEmail(account.email);
    }

    let user = await findUserByEmail(account);
    const unknown = user?.unknown === true;
    let created = false;

    if (!user || unknown) {
      try {
        user = await createAuthUser(account);
        created = true;
      } catch (err) {
        const exists = /already exists|has already been created|\b422\b/i.test(err.message);
        if (!exists) {
          if (isAuthDbError(err.message)) {
            throw new Error(
              `Supabase Auth juga gagal menulis auth.users (${err.message}). Jalankan ` +
                `supabase/migrations/20261017_fix_auth_admin_users_500.sql di SQL Editor, ` +
                `lihat bagian PROBE untuk objek yang bermasalah, lalu ulangi script ini.`
            );
          }
          throw err;
        }
        // Akun sudah ada tetapi endpoint baca tidak bisa mengembalikannya.
        const id = await resolveExistingId(account);
        if (!id) {
          throw new Error(
            `Akun ${account.email} sudah ada di Supabase Auth, tapi id-nya tidak bisa ` +
              `dibaca (endpoint admin rusak) dan tidak ada baris profiles untuk email itu. ` +
              `Ambil id-nya dari Dashboard Supabase lalu isi sebagai profileId di script ini.`
          );
        }
        user = { id, email: account.email };
        console.warn(`   akun ${account.email} sudah ada (id ${id}); kata sandi tidak ditimpa.`);
      }
    } else if (account.profileId && user.id !== account.profileId) {
      console.warn(
        `   catatan: user ${account.email} sudah ada dengan id lain; profiles tetap ditautkan ke id tersebut.`
      );
    }

    const profileId = await syncProfile(user, account, branchId);

    if (account.role === "muthawif") await linkMasterData("guides", profileId, account.email);
    if (account.role === "mitra_agen") await linkMasterData("agents", profileId, account.email);

    console.log(
      `${created ? "DIBUAT " : "SUDAH ADA"} ${account.email.padEnd(28)} ${account.role.padEnd(12)} ${profileId}`
    );
  }

  console.log(`\nSemua akun demo memakai kata sandi: ${PASSWORD}`);
  console.log("Akun yang sudah ada tidak diganti kata sandinya (ketentuan script ini).");
  console.log("Ganti setelah login pertama lewat halaman pengguna atau Dashboard Supabase.");
}

main().catch((err) => {
  console.error("\nSeed gagal:", err.message || err);
  process.exit(1);
});
