import { z } from "zod";
export type {
  DocumentRow,
  DocumentInsert,
  DocumentUpdate,
  ProfileRow,
  DocumentStatus,
  DocumentType,
  DocumentWithProfile,
} from "../services/documentService";

export const documentFormSchema = z.object({
  pilgrim_id: z.string().uuid("ID Jamaah harus berupa UUID valid"),
  document_type: z.enum(["passport", "visa", "vaccine_certificate", "other"]),
  document_number: z.string().min(3, "Nomor dokumen minimal 3 karakter").optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  file_url: z.string().url("Format URL file tidak valid").optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export type DocumentFormData = z.infer<typeof documentFormSchema>;

// Backward compatibility
export const taskFormSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.string(),
  priority: z.string(),
  status: z.string(),
  dueDate: z.string(),
  assignee: z.string(),
  assigneeRole: z.string(),
  relatedPackage: z.string().optional(),
});
export type TaskFormData = z.infer<typeof taskFormSchema>;

export interface TaskFiltersState {
  status: string;
  category: string;
  priority: string;
  search: string;
}
