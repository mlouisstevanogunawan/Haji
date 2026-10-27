/**
 * Midtrans menambahkan parameter hasil pembayaran pada URL callback:
 * order_id, transaction_id, transaction_status, status_code, gross_amount,
 * payment_type, fraud_status. Nilai ini hanya dipakai sebagai petunjuk untuk
 * menanyakan transaksi yang sama ke Midtrans Status API — bukan sebagai bukti.
 */
export function pickCallbackParam(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) return value[0]?.trim() || undefined;
  return undefined;
}
