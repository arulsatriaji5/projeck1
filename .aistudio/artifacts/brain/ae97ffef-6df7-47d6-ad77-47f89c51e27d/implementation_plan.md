# Rencana Implementasi: Fitur Batasan AI & Gudang Referensi Multi-Modal ClipA Studio

Berikut adalah rencana arsitektur dan langkah teknis untuk mengimplementasikan pembaruan antarmuka ClipA Studio sesuai spesifikasi pengguna.

---

## 1. Ringkasan Kebutuhan & Hasil Klarifikasi
1. **AI Editing Constraints Input**:
   - Kolom textarea *"Instruksi & Batasan Edit Spesifik"* diposisikan di dalam panel input video, tepat di bawah tab pilihan URL dan Local Upload.
   - Desain Dark Mode konsisten (`bg-zinc-900`/`bg-black`, border `border-zinc-800`, focus ring `sky-400`).
   - Teks placeholder: *"Minimal duration 30s, max 60s. Make the hook 3 seconds long. Use yellow neon subtitles with black shadows."*
   - Tombol pintasan chip preset cepat (misal: "Durasi 30-60s", "Hook 3 Detik Cepat", "Subtitle Kuning Neon", "Pacing Cepat (Zero Silence)") untuk memudahkan pengisian satu klik.

2. **Gudang Referensi Editan (Multi-Modal)**:
   - Teks panduan kapabilitas AI pada header:
     > *"Video (AI meniru style & visual), Gambar (AI meniru visual), Dokumen (AI menyimpulkan konteks teks menjadi visual)."*
   - Aksi *"Tambah Referensi Baru"* ditingkatkan menjadi **Modal Popup Interaktif** yang mendukung drag-and-drop dan pemilihan format multi-modal:
     - **Video**: File `.mp4`
     - **Gambar**: File `.png`, `.jpg`, `.jpeg`, `.webp`
     - **Dokumen**: File `.pdf`, `.txt`
     - **Link URL**: Tautan media sosial (TikTok, Instagram Reels, YouTube Shorts)
   - Kartu Referensi (Reference Cards) diperbarui dengan ikon/thumbnail visual yang membedakan tipe media, detail ukuran/nama file, dan filter berdasarkan tipe modalitas.

---

## 2. Arsitektur Komponen & State Management

### A. Tipe Data Baru (`ReferenceItem`)
```typescript
export type MediaType = 'video' | 'image' | 'document' | 'url';

export interface ReferenceItem {
  id: string;
  title: string;
  mediaType: MediaType;
  url?: string;
  fileData?: {
    name: string;
    size: string;
    type: string;
    previewUrl?: string;
  };
  platform?: 'tiktok' | 'instagram' | 'youtube' | 'lainnya';
  category: string;
  notes: string;
  createdAt: string;
}
```

### B. State Tambahan di `AutoClipInputView.tsx`
- `aiConstraints`: string state untuk menampung teks batasan edit spesifik.
- `isAddModalOpen`: boolean state untuk menampilkan/menyembunyikan modal popup tambah referensi.
- `modalMediaType`: 'video' | 'image' | 'document' | 'url' tab aktif dalam modal.
- `uploadedMediaFile`: File | null untuk menyimpan file yang diunggah saat membuat referensi.
- `mediaPreviewUrl`: string | null untuk preview gambar/video dalam referensi.
- `filterMediaType`: 'all' | 'video' | 'image' | 'document' | 'url'.

---

## 3. Rencana Langkah Eksekusi

### Langkah 1: Implementasi Kolom "Instruksi & Batasan Edit Spesifik"
1. Letakkan komponen textarea tepat di bawah tab Dual-Input (URL & Local Upload) di `AutoClipInputView.tsx`.
2. Tambahkan deretan chip preset interaktif:
   - *"⏱️ Durasi 30-60 detik"*
   - *"⚡ Hook 3 Detik Agresif"*
   - *"🟨 Subtitle Kuning Neon & Bayangan Hitam"*
   - *"✂️ Pacing Cepat (Zero Silence Cut)"*
   - *"🔍 Dynamic Zoom 1.2x pada Punchline"*
3. Sediakan tombol bersihkan atau reset batasan jika diperlukan.
4. Teruskan teks batasan ini ke payload proses video saat tombol "Proses Video" atau "Proses Video Lokal" ditekan.

### Langkah 2: Peningkatan Header & Banner Kapabilitas AI di Gudang Referensi
1. Perbarui header Gudang Referensi dengan kartu informatif bergaya dark mode:
   - Video badge: *Video (AI meniru style & visual)*
   - Gambar badge: *Gambar (AI meniru visual)*
   - Dokumen badge: *Dokumen (AI menyimpulkan konteks teks menjadi visual)*
2. Desain banner yang elegan dengan ikon berwarna sky-400, emerald-400, dan amber-400.

### Langkah 3: Pembuatan Modal Popup Multi-Modal Tambah Referensi
1. Buat modal dialog popup yang fokus dengan backdrop blur gelap.
2. Sediakan selector tipe media interaktif:
   - Tombol tab: **Video (.mp4)** | **Gambar (.png/.jpg)** | **Dokumen (.pdf/.txt)** | **Tautan URL**
3. Area drag-and-drop dinamis sesuai tipe yang dipilih:
   - Menampilkan preview thumbnail jika memilih gambar.
   - Menampilkan badge file video dan ukuran jika memilih .mp4.
   - Menampilkan badge dokumen PDF/TXT jika memilih dokumen.
   - Menampilkan input URL jika memilih tautan web.
4. Input judul, kategori, dan catatan instruksi editing (pacing, hook, visual style).
5. Validasi input sebelum disimpan ke state `references` dan tersinkronisasi ke `localStorage`.

### Langkah 4: Pembaruan Tampilan Kartu Referensi (Reference Cards)
1. Tampilkan thumbnail/ikon media yang jelas di setiap kartu:
   - **Video**: Ikon pemutar video dengan badge `.MP4` dan durasi/ukuran file.
   - **Gambar**: Miniatur foto asli dengan pembesaran saat di-hover dan badge `.PNG/.JPG`.
   - **Dokumen**: Ikon dokumen dengan badge teks `.PDF/.TXT` dan ringkasan teks.
   - **URL**: Ikon platform (TikTok/Reels/Shorts) dengan tombol buka link.
2. Pertahankan fitur salin catatan teknis ke clipboard dan tombol hapus.
3. Tambahkan filter tipe media (Semua, Video, Gambar, Dokumen, URL).

---

## 4. Rencana Verifikasi & Validasi
1. **Linting**: Jalankan `lint_applet` untuk memastikan tidak ada kesalahan sintaks, tipe TypeScript, atau missing imports.
2. **Build Compilation**: Jalankan `compile_applet` untuk memverifikasi proses build Vite berhasil tanpa error.
3. **Uji Fungsionalitas**:
   - Mengetik dan mengeklik preset chip pada textarea batasan AI.
   - Membuka modal popup multi-modal, menguji upload file gambar/video/dokumen dan submit referensi.
   - Memastikan referensi tersimpan di `localStorage` dan tampil dengan badge/ikon yang tepat.
   - Memastikan UI responsif di perangkat desktop maupun seluler dalam tema Dark Mode.
