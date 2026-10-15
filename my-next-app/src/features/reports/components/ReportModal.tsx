"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ReportTransaction } from "@/types/database.types";
import { getPackages, PackageRow } from "@/services/packageService";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ReportTransaction, "id" | "transactionNumber">) => Promise<void>;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [packages, setPackages] = React.useState<PackageRow[]>([]);
  const [formData, setFormData] = React.useState({
    pilgrimName: "",
    passportNumber: "",
    packageName: "",
    packageCategory: "Reguler",
    amount: 10000000,
    paymentType: "DP" as ReportTransaction["paymentType"],
    paymentMethod: "BSI Virtual Account" as ReportTransaction["paymentMethod"],
    status: "Berhasil" as ReportTransaction["status"],
    transactionDate: new Date().toISOString().split("T")[0],
  });

  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    getPackages().then((pkgs) => {
      setPackages(pkgs);
      if (pkgs.length > 0 && !formData.packageName) {
        setFormData((prev) => ({
          ...prev,
          packageName: pkgs[0].name,
          packageCategory: pkgs[0].type,
        }));
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pilgrimName || !formData.passportNumber || formData.amount <= 0) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        pilgrimName: "",
        passportNumber: "",
        packageName: packages[0]?.name || "",
        packageCategory: packages[0]?.type || "Reguler",
        amount: 10000000,
        paymentType: "DP",
        paymentMethod: "BSI Virtual Account",
        status: "Berhasil",
        transactionDate: new Date().toISOString().split("T")[0],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const packageOptions = packages.map((p) => ({
    label: p.name,
    value: p.name,
  }));

  const paymentTypeOptions = [
    { label: "DP (Uang Muka)", value: "DP" },
    { label: "Pelunasan", value: "Pelunasan" },
    { label: "Full Payment (Lunas)", value: "Full Payment" },
  ];

  const paymentMethodOptions = [
    { label: "BSI Virtual Account", value: "BSI Virtual Account" },
    { label: "Transfer Bank BCA", value: "Transfer Bank BCA" },
    { label: "Transfer Mandiri", value: "Transfer Mandiri" },
    { label: "Tunai / Cash Kasir", value: "Cash" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Transaksi Pembayaran Jamaah"
      description="Input kuitansi setoran DP atau pelunasan tiket dan akomodasi jamaah."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nama Lengkap Jamaah"
            placeholder="Ahmad Fauzi Rahman"
            value={formData.pilgrimName}
            onChange={(e) =>
              setFormData({ ...formData, pilgrimName: e.target.value })
            }
            required
          />

          <Input
            label="Nomor Paspor"
            placeholder="C8921445"
            value={formData.passportNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                passportNumber: e.target.value.toUpperCase(),
              })
            }
            required
          />
        </div>

        <Select
          label="Paket Umroh"
          options={packageOptions}
          value={formData.packageName}
          onChange={(e) => {
            const selected = packages.find((p) => p.name === e.target.value);
            setFormData({
              ...formData,
              packageName: e.target.value,
              packageCategory: selected?.type || "Reguler",
            });
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nominal Pembayaran (Rp)"
            type="number"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: Number(e.target.value) })
            }
            required
          />

          <Input
            label="Tanggal Transaksi"
            type="date"
            value={formData.transactionDate}
            onChange={(e) =>
              setFormData({ ...formData, transactionDate: e.target.value })
            }
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Jenis Pembayaran"
            options={paymentTypeOptions}
            value={formData.paymentType}
            onChange={(e) =>
              setFormData({
                ...formData,
                paymentType: e.target.value as ReportTransaction["paymentType"],
              })
            }
          />

          <Select
            label="Metode Pembayaran"
            options={paymentMethodOptions}
            value={formData.paymentMethod}
            onChange={(e) =>
              setFormData({
                ...formData,
                paymentMethod: e.target.value as ReportTransaction["paymentMethod"],
              })
            }
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="default" size="sm" isLoading={isLoading}>
            Simpan Transaksi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
