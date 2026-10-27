/**
 * Registry kolom yang boleh ditulis dari aplikasi.
 *
 * Ini dipakai /api/db untuk memvalidasi payload. Tujuannya ganda:
 *  1. Keamanan — mencegah endpoint tulis menjadi akses bebas ke tabel mana pun.
 *  2. Diagnosa — nama kolom yang salah ketik dulu gagal senyap di PostgREST;
 *     sekarang dilempar error eksplisit di sini.
 *
 * Sinkron dengan supabase/migrations/20261017_sync_crud_schema_and_rls.sql.
 */

const AUDIT = ["created_at", "updated_at"];

export const WRITABLE_COLUMNS: Record<string, readonly string[]> = {
  profiles: [
    "id", "email", "full_name", "avatar_url", "role",
    "branch_id", "is_active", "phone", "agent_code",
    "gender", "nik", "passport_number", "passport_expiry",
    "status", "address", "city", "birth_place", "birth_date",
    "blood_type", "passport_issue_place", "passport_issue_date",
    "mahram_name", "mahram_relation",
    "emergency_contact_name", "emergency_contact_phone", "health_notes",
    ...AUDIT,
  ],
  branches: [
    "id", "name", "code", "city", "address", "phone", "email",
    "is_headquarter", "is_active", ...AUDIT,
  ],
  bank_accounts: [
    "id", "bank_name", "branch_name", "account_number", "account_holder",
    "office_branch", "is_active", ...AUDIT,
  ],
  packages: [
    // booked_count sengaja tidak ada di daftar: kolom itu dihitung ulang oleh
    // trigger trg_bookings_sync_count, ditulis dari aplikasi hanya akan membuat
    // jumlah kursi melenceng dari booking yang sebenarnya.
    "id", "name", "type", "price", "duration_days", "quota", "facilities",
    "description", "is_active", "departure_date", "departure_city", "airline",
    "facilities_excluded", "code", "down_payment", "branch_id", ...AUDIT,
  ],
  hotels: [
    "id", "name", "city", "address", "rating", "price_per_night", "photo_url",
    "star_rating", "distance_to_haram", "description", "is_active", ...AUDIT,
  ],
  flights: [
    "id", "airline_code", "airline_name", "route", "flight_number",
    "is_active", ...AUDIT,
  ],
  guides: [
    "id", "user_id", "name", "phone", "email", "experience_years",
    "language_skills", "is_active", "code", "branch_id",
    "gender", "specialization", "bio", ...AUDIT,
  ],
  agents: [
    "id", "user_id", "name", "phone", "email", "commission_rate", "is_active",
    "code", "branch_id", "city", ...AUDIT,
  ],
  bookings: [
    "id", "pilgrim_id", "package_id", "booking_date", "departure_date",
    "return_date", "status", "total_price", "agent_id", "guide_id",
    "invoice_number", "kode_booking", "room_type", "notes", ...AUDIT,
  ],
  documents: [
    "id", "pilgrim_id", "document_type", "document_number", "issue_date",
    "expiry_date", "file_url", "status", "pilgrim_name",
    "document_status_note", ...AUDIT,
  ],
  equipment: [
    "id", "name", "category", "quantity", "condition", ...AUDIT,
  ],
  equipment_assignments: [
    "id", "equipment_id", "booking_id", "pilgrim_id", "pilgrim_name",
    "item_name", "quantity", "condition", "size", "is_delivered",
    "delivered_at", "notes", ...AUDIT,
  ],
  announcements: [
    "id", "title", "content", "target_audience", "is_published",
    "published_at", "branch_id", "package_id", "expires_at", ...AUDIT,
  ],
  commissions: [
    "id", "agent_id", "booking_id", "amount", "status", "paid_at", ...AUDIT,
  ],
  invoices: [
    "id", "invoice_number", "jamaah_id", "booking_id", "type", "amount",
    "paid_amount", "status", "due_date", "midtrans_order_id",
    "midtrans_transaction_id", "payment_method", "payment_date", ...AUDIT,
  ],
  payments: [
    "id", "invoice_id", "order_id", "transaction_id", "payment_type",
    "gross_amount", "transaction_status", "fraud_status", "settlement_time",
    "raw_response", "created_at",
  ],
  manasik_sessions: [
    "id", "title", "package_id", "package_name", "session_date", "session_time",
    "location", "muthawif_id", "muthawif_name", "notes", ...AUDIT,
  ],
  manasik_attendance: [
    "id", "session_id", "pilgrim_id", "pilgrim_name", "nik", "status", "notes",
    ...AUDIT,
  ],
  system_settings: [
    "id", "travel_name", "company_legal_name", "ppiu_number", "pihk_number",
    "accreditation", "established_year", "support_phone", "support_email",
    "website_url", "head_office_address", "default_dp_amount",
    "payment_due_days_before_departure", "enable_midtrans_gateway",
    "admin_fee_amount", "wa_gateway_api_key", "wa_gateway_sender_number",
    "enable_wa_new_registration", "enable_wa_payment_reminder",
    "enable_wa_manasik_reminder", "enable_email_receipt",
    "session_timeout_minutes", "enforce_strong_password",
    "enable_audit_trail_logging", "subtitle", "footer_text",
    "primary_color", "secondary_color", "logo_url", "favicon_url", ...AUDIT,
  ],
  activity_logs: [
    "id", "user_id", "action", "description", "ip_address", "metadata",
    "created_at",
  ],
} as const;

export type WritableTable = keyof typeof WRITABLE_COLUMNS;

export function isWritableTable(table: string): table is WritableTable {
  return Object.prototype.hasOwnProperty.call(WRITABLE_COLUMNS, table);
}

export function unknownColumns(
  table: WritableTable,
  payload: Record<string, unknown>
): string[] {
  const allowed = new Set<string>(WRITABLE_COLUMNS[table]);
  return Object.keys(payload).filter((key) => !allowed.has(key));
}
