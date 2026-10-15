export interface MidtransCustomerDetails {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  billing_address?: {
    first_name?: string;
    last_name?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country_code?: string;
  };
}

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
  merchant_name?: string;
}

export interface MidtransSnapRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details?: MidtransItemDetail[];
  customer_details?: MidtransCustomerDetails;
  enabled_payments?: string[];
  credit_card?: {
    secure?: boolean;
    channel?: string;
    bank?: string;
  };
  callbacks?: {
    finish?: string;
    error?: string;
    close?: string;
  };
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransNotificationPayload {
  transaction_time: string;
  transaction_status:
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "cancel"
    | "expire"
    | "refund"
    | "partial_refund"
    | "authorize";
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: "accept" | "deny" | "challenge";
  currency: string;
  settlement_time?: string;
  approval_code?: string;
  bank?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  biller_code?: string;
  bill_key?: string;
}

export type InvoicePaymentType = "dp" | "cicilan" | "pelunasan";
export type InvoiceStatus = "unpaid" | "partial" | "paid" | "expired" | "cancelled";

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  booking_id?: string;
  jamaah_id?: string;
  type: InvoicePaymentType;
  amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  due_date: string;
  midtrans_order_id?: string | null;
  midtrans_transaction_id?: string | null;
  payment_method?: string | null;
  payment_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentChannelOption {
  id: string;
  name: string;
  category: "ewallet" | "va" | "qris";
  description: string;
  isRecommended?: boolean;
  iconName?: string;
  midtransKey?: string;
}
