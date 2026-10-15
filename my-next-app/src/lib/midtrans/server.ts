import crypto from "crypto";
import {
  MidtransSnapRequest,
  MidtransSnapResponse,
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
