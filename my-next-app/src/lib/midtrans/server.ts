import crypto from "crypto";
import {
  MidtransSnapRequest,
  MidtransSnapResponse,
  MidtransTransactionStatus,
} from "./types";

export function getMidtransConfig() {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const merchantId = process.env.MIDTRANS_MERCHANT_ID || "";
  const baseUrl = process.env.MIDTRANS_BASE_URL || (isProduction
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com");

  const snapBaseUrl = `${baseUrl}/snap/v1/transactions`;

  return {
    isProduction,
    serverKey,
    clientKey,
    merchantId,
    baseUrl,
    snapBaseUrl,
  };
}

/**
 * Midtrans Snap Client kompatibel dengan interface midtrans-client
 */
export class MidtransSnapClient {
  public isProduction: boolean;
  public serverKey: string;
  public clientKey: string;

  constructor(options?: {
    isProduction?: boolean;
    serverKey?: string;
    clientKey?: string;
  }) {
    const config = getMidtransConfig();
    this.isProduction = options?.isProduction ?? config.isProduction;
    this.serverKey = options?.serverKey ?? config.serverKey;
    this.clientKey = options?.clientKey ?? config.clientKey;
  }

  async createTransaction(parameter: MidtransSnapRequest): Promise<MidtransSnapResponse> {
    return createSnapTransaction(parameter);
  }

  async createTransactionToken(parameter: MidtransSnapRequest): Promise<string> {
    const res = await createSnapTransaction(parameter);
    return res.token;
  }

  async createTransactionRedirectUrl(parameter: MidtransSnapRequest): Promise<string> {
    const res = await createSnapTransaction(parameter);
    return res.redirect_url;
  }
}

export const snap = new MidtransSnapClient();

/**
 * Memanggil Midtrans Snap API untuk membuat token transaksi
 */
export async function createSnapTransaction(
  payload: MidtransSnapRequest
): Promise<MidtransSnapResponse> {
  const { serverKey, snapBaseUrl } = getMidtransConfig();

  // Jika belum ada server key asli atau masih dummy sandbox
  const isDummyKey = !serverKey || serverKey.includes("dummy") || serverKey.includes("xxxxx");

  if (isDummyKey) {
    const mockToken = `snap-demo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    return {
      token: mockToken,
      redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${mockToken}`,
    };
  }

  const authString = Buffer.from(`${serverKey}:`).toString("base64");

  const response = await fetch(snapBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Midtrans Snap API Error [${response.status}]: ${errorText || response.statusText}`
    );
  }

  const data = (await response.json()) as MidtransSnapResponse;
  return data;
}

/**
 * Verifikasi signature SHA-512 dari notification webhook Midtrans:
 * SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const { serverKey } = getMidtransConfig();
  if (!serverKey) return false;

  const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedSignature = crypto
    .createHash("sha512")
    .update(rawString)
    .digest("hex");

  return computedSignature.toLowerCase() === signatureKey.toLowerCase();
}

export type MidtransStatusFetch =
  | { ok: true; status: MidtransTransactionStatus; endpoint: string }
  | {
      ok: false;
      code: "not_found" | "unauthorized" | "unconfigured" | "gateway_error";
      httpStatus: number;
      message: string;
    };

/**
 * Tanya status transaksi LANGSUNG ke Midtrans dengan Basic auth server key.
 *
 * Ini jalur yang dipakai tanpa Notification URL di dashboard: jawabannya
 * berasal dari Midtrans lewat koneksi server-to-server, jadi bisa dipakai
 * sebagai sumber kebenaran — berbeda dengan query string redirect yang boleh
 * ditulis siapa pun di address bar.
 *
 * Dicoba dua endpoint: Core API v2 (bentuk flat), lalu Snap v1 bila v2 bilang
 * tidak ditemukan (transaksi Snap kadang hanya terdaftar di endpoint Snap).
 */
export async function getMidtransTransactionStatus(
  orderId: string,
  transactionId?: string | null
): Promise<MidtransStatusFetch> {
  const { serverKey, baseUrl, isProduction } = getMidtransConfig();

  if (!serverKey || serverKey.includes("dummy") || serverKey.includes("xxxxx")) {
    return {
      ok: false,
      code: "unconfigured",
      httpStatus: 503,
      message:
        "MIDTRANS_SERVER_KEY belum dipasang pada deployment ini, jadi status tidak bisa " +
        "ditanyakan ke Midtrans.",
    };
  }

  const auth = Buffer.from(`${serverKey}:`).toString("base64");
  const ids = [orderId, transactionId].filter((v): v is string => Boolean(v));

  const candidates: Array<{ label: string; url: string }> = [];
  for (const id of ids) {
    const enc = encodeURIComponent(id);
    candidates.push({ label: `v2/${id}/status`, url: `${baseUrl}/v2/${enc}/status` });
    candidates.push({
      label: `snap/${id}/status`,
      url: `${baseUrl}/snap/v1/transactions/${enc}/status`,
    });
  }

  let lastStatus = 0;
  let lastBody = "";

  for (const candidate of candidates) {
    let response: Response;
    try {
      response = await fetch(candidate.url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${auth}`,
        },
        cache: "no-store",
      });
    } catch (err) {
      console.warn(`[midtrans:status] ${candidate.label} tidak dapat dijangkau:`, err);
      lastStatus = 0;
      lastBody = (err as Error).message;
      continue;
    }

    const text = await response.text();
    console.log(
      `[midtrans:status] GET ${candidate.label} -> ${response.status} ${text.slice(0, 400)}`
    );

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        code: "unauthorized",
        httpStatus: 502,
        message:
          `Midtrans menolak server key ini (HTTP ${response.status}) pada lingkungan ` +
          `${isProduction ? "production" : "sandbox"}. Pastikan MIDTRANS_SERVER_KEY dan ` +
          `MIDTRANS_IS_PRODUCTION berasal dari akun/lingkungan yang sama.`,
      };
    }

    if (response.status === 404) {
      lastStatus = 404;
      lastBody = text;
      continue;
    }

    if (!response.ok) {
      lastStatus = response.status;
      lastBody = text;
      continue;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      // Midtrans membalas HTML untuk beberapa kegagalan; jangan pura-pura tahu.
      lastStatus = response.status;
      lastBody = text;
      continue;
    }

    const details = (parsed.transaction_details ?? {}) as Record<string, unknown>;
    const pick = (key: string) => parsed[key] ?? details[key] ?? "";

    const status: MidtransTransactionStatus = {
      order_id: String(pick("order_id")) || orderId,
      transaction_id: parsed.transaction_id ? String(parsed.transaction_id) : null,
      gross_amount: String(pick("gross_amount")),
      currency: String(pick("currency") || "IDR"),
      payment_type: String(pick("payment_type")),
      status_code: String(pick("status_code")),
      transaction_status: String(pick("transaction_status")),
      fraud_status: (parsed.fraud_status as MidtransTransactionStatus["fraud_status"]) ?? null,
      settlement_time: parsed.settlement_time ? String(parsed.settlement_time) : null,
      transaction_time: parsed.transaction_time ? String(parsed.transaction_time) : null,
      status_message: parsed.status_message ? String(parsed.status_message) : null,
      merchant_id: parsed.merchant_id ? String(parsed.merchant_id) : null,
    };

    return { ok: true, endpoint: candidate.label, status };
  }

  if (lastStatus === 404) {
    return {
      ok: false,
      code: "not_found",
      httpStatus: 404,
      message:
        `Transaksi ${orderId} tidak ditemukan di Midtrans ${isProduction ? "production" : "sandbox"}. ` +
        "Biasanya order_id dibuat (Snap token) tapi belum pernah dibayar, atau key-nya " +
        "berasal dari lingkungan/account yang lain.",
    };
  }

  return {
    ok: false,
    code: "gateway_error",
    httpStatus: 502,
    message: `Midtrans membalas HTTP ${lastStatus || "-"}: ${lastBody.slice(0, 200) || "tanpa body"}`,
  };
}
