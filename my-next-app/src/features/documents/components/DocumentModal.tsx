"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCreateDocument } from "../hooks/useDocuments";
import { DocumentInsert, DocumentType } from "../services/documentService";

export interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPilgrimId?: string;
}

export type TaskModalProps = DocumentModalProps;

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  defaultPilgrimId = "",
}) => {
  const createDocumentMutation = useCreateDocument();

  const [pilgrimId, setPilgrimId] = React.useState<string>(defaultPilgrimId);
  const [documentType, setDocumentType] = React.useState<DocumentType>("passport");
  const [documentNumber, setDocumentNumber] = React.useState<string>("");
  const [issueDate, setIssueDate] = React.useState<string>("");
  const [expiryDate, setExpiryDate] = React.useState<string>("");
  const [fileUrl, setFileUrl] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (defaultPilgrimId) {
      setPilgrimId(defaultPilgrimId);
    }
  }, [defaultPilgrimId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!pilgrimId.trim()) {
      setErrorMessage("ID Jamaah (Pilgrim ID / Profile ID) wajib diisi.");
      return;
    }

    const payload: DocumentInsert = {
      pilgrim_id: pilgrimId.trim(),
      document_type: documentType,
      document_number: documentNumber.trim() || null,
      issue_date: issueDate || null,
      expiry_date: expiryDate || null,
      file_url: fileUrl.trim() || null,
      status: "pending",
    };

    try {
      await createDocumentMutation.mutateAsync(payload);
      // Reset form
      setDocumentNumber("");
      setIssueDate("");
      setExpiryDate("");
      setFileUrl("");
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan dokumen baru ke Supabase.");
    }
  };

  const documentTypeOptions = [
    { label: "Paspor Fisik (Passport)", value: "passport" },
    { label: "Visa Umroh / Haji", value: "visa" },
    { label: "Sertifikat Vaksin Meningitis", value: "vaccine_certificate" },
    { label: "Dokumen Lainnya (KTP / KK)", value: "other" },
  ];

  const isPending = createDocumentMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unggah Dokumen Jamaah Baru"
      description="Rekam nomor dan lampiran berkas dokumen paspor atau visa ke database Supabase."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 font-medium">
            {errorMessage}
          </div>
        )}

        <Input
          label="ID Jamaah (Profile ID)"
          placeholder="contoh UUID: a45dbce1-a1ab-476b-a69b-554aec224482"
          value={pilgrimId}
          onChange={(e) => setPilgrimId(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tipe Dokumen"
            options={documentTypeOptions}
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          />

          <Input
            label="Nomor Dokumen / Paspor"
            placeholder="misal: E7788991"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tanggal Terbit (Issue Date)"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />

          <Input
            label="Tanggal Kedaluwarsa (Expiry Date)"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        <Input
          label="Tautan Berkas File (URL)"
          placeholder="https://storage.supabase.co/..."
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />

        <div className="pt-3 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Menyimpan Dokumen..." : "Simpan Dokumen"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const TaskModal = DocumentModal;
