// Shared Midtrans config usable from both server and client components.
// MIDTRANS_IS_PRODUCTION is a server-only var; NEXT_PUBLIC_ mirror lets client
// UI (badges, displayed amounts) stay consistent with what the gateway receives.

export const IS_PRODUCTION =
  process.env.MIDTRANS_IS_PRODUCTION === "true" ||
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

// Safe flat test amount well under the Rp 10.000.000 sandbox ceiling.
export const SANDBOX_TEST_AMOUNT = 1_000_000;

// Base URL used for Snap redirect callbacks (finish / error / pending / close).
export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://haji-silk.vercel.app";

/**
 * Returns the amount that should actually be sent to Midtrans and persisted.
 * In production the original nominal is used untouched. In sandbox mode every
 * charge is normalized to a safe test value so no channel throws
 * "Exceeds max. transaction amount".
 */
export function getMidtransAmount(originalAmount: number): number {
  const n = Math.round(Number(originalAmount) || 0);
  if (IS_PRODUCTION) return n;
  if (n <= 0) return n;
  return Math.min(n, SANDBOX_TEST_AMOUNT);
}

export function buildSnapCallbacks() {
  return {
    finish: `${APP_BASE_URL}/pembayaran-sukses`,
    success: `${APP_BASE_URL}/pembayaran-sukses`,
    pending: `${APP_BASE_URL}/pembayaran-pending`,
    error: `${APP_BASE_URL}/pembayaran-gagal`,
    deny: `${APP_BASE_URL}/pembayaran-gagal`,
    cancel: `${APP_BASE_URL}/pembayaran-gagal`,
    close: `${APP_BASE_URL}/pembayaran-pending`,
  };
}
