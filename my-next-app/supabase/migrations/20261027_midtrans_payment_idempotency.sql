-- =====================================================================
-- Midtrans webhook: idempotensi + index pencarian
-- 2026-10-27
--
-- Notifikasi asynchronous Midtrans bisa dikirim lebih dari satu kali untuk
-- transaksi yang sama (retry). Webhook mengecek duplikat dengan SELECT dulu,
-- tapi dua request yang hampir bersamaan bisa sama-sama lolos dari cek itu
-- lalu dua kali menambahkan paid_amount. Index unique di bawah membuat
-- database yang menolak duplikatnya, bukan aplikasi.
--
-- Index hanya dibuat untuk status settlement/capture (uang benar-benar masuk);
-- notifikasi pending/cancel/expire untuk order_id yang sama tetap boleh tercatat
-- sebagai jejak audit.
-- =====================================================================

-- 1. Kunci idempotensi pembayaran.
do $$
declare
  v_dup bigint;
begin
  select count(*) into v_dup
    from (
      select order_id
        from public.payments
       where transaction_status in ('settlement', 'capture')
         and order_id is not null
       group by order_id
      having count(*) > 1
    ) t;

  if v_dup > 0 then
    raise notice
      'Index unique payments dilewati: ada % order_id dengan lebih dari satu pembayaran settled. '
      'Rapikan baris duplikat itu, lalu jalankan ulang bagian ini.', v_dup;
    return;
  end if;

  create unique index if not exists payments_settled_order_id_key
    on public.payments (order_id)
    where transaction_status in ('settlement', 'capture')
      and order_id is not null;
end
$$;

-- 2. Index untuk lookup yang dilakukan webhook dan halaman hasil pembayaran.
create index if not exists payments_order_id_idx
  on public.payments (order_id);

create index if not exists payments_transaction_id_idx
  on public.payments (transaction_id);

create index if not exists invoices_midtrans_order_id_idx
  on public.invoices (midtrans_order_id);

create index if not exists invoices_status_idx
  on public.invoices (status);

-- invoice_number dipakai webhook sebagai kunci pencarian utama; kalau belum ada
-- index-nya, setiap notifikasi melakukan sequential scan.
do $$
declare
  v_dup bigint;
begin
  select count(*) into v_dup
    from (
      select invoice_number
        from public.invoices
       group by invoice_number
      having count(*) > 1
    ) t;

  if v_dup > 0 then
    raise notice
      'Index unique invoice_number dilewati: ada % nomor tagihan rangkap. '
      'Nomor rangkap membuat webhook tidak tahu tagihan mana yang harus dibayar.', v_dup;
    return;
  end if;

  create unique index if not exists invoices_invoice_number_key
    on public.invoices (invoice_number);
end
$$;
