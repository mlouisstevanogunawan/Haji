import { createClient } from "@/lib/supabase/client";
import { dbUpsert } from "@/lib/db/write";

export interface SystemSettingsData {
  id?: string;
  travelName: string;
  companyLegalName: string;
  ppiuNumber: string;
  pihkNumber: string;
  accreditation: string;
  establishedYear: string;
  supportPhone: string;
  supportEmail: string;
  websiteUrl: string;
  headOfficeAddress: string;

  defaultDpAmount: string;
  paymentDueDaysBeforeDeparture: string;
  enableMidtransGateway: boolean;
  adminFeeAmount: string;

  waGatewayApiKey: string;
  waGatewaySenderNumber: string;
  enableWaNewRegistration: boolean;
  enableWaPaymentReminder: boolean;
  enableWaManasikReminder: boolean;
  enableEmailReceipt: boolean;

  sessionTimeoutMinutes: string;
  enforceStrongPassword: boolean;
  enableAuditTrailLogging: boolean;

  // White-label / branding
  subtitle: string;
  footerText: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsData = {
  travelName: "Al-Madinah Travel",
  companyLegalName: "PT Al-Madinah Wisata Syariah",
  ppiuNumber: "Kemenag RI No. U.412 Tahun 2021",
  pihkNumber: "Kemenag RI No. HK.108 Tahun 2023",
  accreditation: "Akreditasi A (Sangat Baik)",
  establishedYear: "2016",
  supportPhone: "0812-9900-1122",
  supportEmail: "layanan@almedinahtravel.com",
  websiteUrl: "https://almedinahtravel.com",
  headOfficeAddress: "Jl. M.H. Thamrin No. 12, Menteng, Jakarta Pusat 10350",

  defaultDpAmount: "5000000",
  paymentDueDaysBeforeDeparture: "30",
  enableMidtransGateway: true,
  adminFeeAmount: "0",

  waGatewayApiKey: "sec_wa_live_99281a8c9b20e1f7",
  waGatewaySenderNumber: "6281299001122",
  enableWaNewRegistration: true,
  enableWaPaymentReminder: true,
  enableWaManasikReminder: true,
  enableEmailReceipt: true,

  sessionTimeoutMinutes: "60",
  enforceStrongPassword: true,
  enableAuditTrailLogging: true,

  subtitle: "",
  footerText: "",
  primaryColor: "",
  secondaryColor: "",
  logoUrl: "",
  faviconUrl: "",
};

export async function getSystemSettings(): Promise<SystemSettingsData> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .eq("id", "default_settings")
    .single();

  if (error || !data) {
    return DEFAULT_SYSTEM_SETTINGS;
  }

  return {
    travelName: data.travel_name || DEFAULT_SYSTEM_SETTINGS.travelName,
    companyLegalName: data.company_legal_name || DEFAULT_SYSTEM_SETTINGS.companyLegalName,
    ppiuNumber: data.ppiu_number || DEFAULT_SYSTEM_SETTINGS.ppiuNumber,
    pihkNumber: data.pihk_number || DEFAULT_SYSTEM_SETTINGS.pihkNumber,
    accreditation: data.accreditation || DEFAULT_SYSTEM_SETTINGS.accreditation,
    establishedYear: data.established_year || DEFAULT_SYSTEM_SETTINGS.establishedYear,
    supportPhone: data.support_phone || DEFAULT_SYSTEM_SETTINGS.supportPhone,
    supportEmail: data.support_email || DEFAULT_SYSTEM_SETTINGS.supportEmail,
    websiteUrl: data.website_url || DEFAULT_SYSTEM_SETTINGS.websiteUrl,
    headOfficeAddress: data.head_office_address || DEFAULT_SYSTEM_SETTINGS.headOfficeAddress,
    defaultDpAmount: String(data.default_dp_amount || DEFAULT_SYSTEM_SETTINGS.defaultDpAmount),
    paymentDueDaysBeforeDeparture: String(data.payment_due_days_before_departure || DEFAULT_SYSTEM_SETTINGS.paymentDueDaysBeforeDeparture),
    enableMidtransGateway: data.enable_midtrans_gateway ?? DEFAULT_SYSTEM_SETTINGS.enableMidtransGateway,
    adminFeeAmount: String(data.admin_fee_amount || DEFAULT_SYSTEM_SETTINGS.adminFeeAmount),
    waGatewayApiKey: data.wa_gateway_api_key || DEFAULT_SYSTEM_SETTINGS.waGatewayApiKey,
    waGatewaySenderNumber: data.wa_gateway_sender_number || DEFAULT_SYSTEM_SETTINGS.waGatewaySenderNumber,
    enableWaNewRegistration: data.enable_wa_new_registration ?? DEFAULT_SYSTEM_SETTINGS.enableWaNewRegistration,
    enableWaPaymentReminder: data.enable_wa_payment_reminder ?? DEFAULT_SYSTEM_SETTINGS.enableWaPaymentReminder,
    enableWaManasikReminder: data.enable_wa_manasik_reminder ?? DEFAULT_SYSTEM_SETTINGS.enableWaManasikReminder,
    enableEmailReceipt: data.enable_email_receipt ?? DEFAULT_SYSTEM_SETTINGS.enableEmailReceipt,
    sessionTimeoutMinutes: String(data.session_timeout_minutes || DEFAULT_SYSTEM_SETTINGS.sessionTimeoutMinutes),
    enforceStrongPassword: data.enforce_strong_password ?? DEFAULT_SYSTEM_SETTINGS.enforceStrongPassword,
    enableAuditTrailLogging: data.enable_audit_trail_logging ?? DEFAULT_SYSTEM_SETTINGS.enableAuditTrailLogging,

    subtitle: data.subtitle ?? "",
    footerText: data.footer_text ?? "",
    primaryColor: data.primary_color ?? "",
    secondaryColor: data.secondary_color ?? "",
    logoUrl: data.logo_url ?? "",
    faviconUrl: data.favicon_url ?? "",
  };
}

export async function saveSystemSettings(settings: SystemSettingsData): Promise<boolean> {
  const supabase = createClient();
  const dbPayload = {
    id: "default_settings",
    travel_name: settings.travelName,
    company_legal_name: settings.companyLegalName,
    ppiu_number: settings.ppiuNumber,
    pihk_number: settings.pihkNumber,
    accreditation: settings.accreditation,
    established_year: settings.establishedYear,
    support_phone: settings.supportPhone,
    support_email: settings.supportEmail,
    website_url: settings.websiteUrl,
    head_office_address: settings.headOfficeAddress,
    default_dp_amount: parseFloat(settings.defaultDpAmount) || 5000000,
    payment_due_days_before_departure: parseInt(settings.paymentDueDaysBeforeDeparture) || 30,
    enable_midtrans_gateway: settings.enableMidtransGateway,
    admin_fee_amount: parseFloat(settings.adminFeeAmount) || 0,
    wa_gateway_api_key: settings.waGatewayApiKey,
    wa_gateway_sender_number: settings.waGatewaySenderNumber,
    enable_wa_new_registration: settings.enableWaNewRegistration,
    enable_wa_payment_reminder: settings.enableWaPaymentReminder,
    enable_wa_manasik_reminder: settings.enableWaManasikReminder,
    enable_email_receipt: settings.enableEmailReceipt,
    session_timeout_minutes: parseInt(settings.sessionTimeoutMinutes) || 60,
    enforce_strong_password: settings.enforceStrongPassword,
    enable_audit_trail_logging: settings.enableAuditTrailLogging,

    subtitle: settings.subtitle?.trim() ? settings.subtitle : null,
    footer_text: settings.footerText?.trim() ? settings.footerText : null,
    primary_color: settings.primaryColor?.trim() ? settings.primaryColor : null,
    secondary_color: settings.secondaryColor?.trim() ? settings.secondaryColor : null,
    logo_url: settings.logoUrl?.trim() ? settings.logoUrl : null,
    favicon_url: settings.faviconUrl?.trim() ? settings.faviconUrl : null,
  };

  await dbUpsert("system_settings", dbPayload, { id: "default_settings" });

  return true;
}
