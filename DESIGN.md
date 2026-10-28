# DESIGN.md — Direction & Visual Language

## 1. Product Identity
- **Product Name:** Sistem Monitoring Operasional Teknik (WO/SPK Tracker & Cloud Drive Management)
- **Domain:** Mechanical & Electrical (ME) Engineering Operations
- **Target Audience:** Operational Managers, Project Coordinators, Field Supervisors, and Lead Technicians across 3 Sub-Divisions (Fueling System Engineering, IT Engineering, Electrical Engineering).
- **Mood / Character:** Industrial Precision, High-Density Technical Workbench, Linear/Retool-level clarity. Functional, calm, reliable, and free of superficial AI clutter.

---

## 2. Three Dials (Anti-Slop Alignment)
- **ENERGY: 1 (Calm)**
  - Clean operational focus. No oversized hype banners, no marketing jargon, no fake growth deltas.
  - White/slate backgrounds with high visual contrast and purposeful data density.
- **RHYTHM: 1 (Structured)**
  - Predictable modular layouts: navigation bar, operational metric strip, multi-dimensional query filters, and data tables with immediate feedback.
- **MOTION: 1 (Hover & Immediate Feedback Only)**
  - Subtly tuned 150ms transitions for tabs, modal dismissals, and button hover states.
  - Zero endless pulsing animations, zero decorative spinning or floating loops.

---

## 3. Visual System & Color Tokens

### 3.1 Base Neutrals
- **Background Canvas:** `#f8fafc` (`slate-50`) to `#ffffff`
- **Surface Cards & Modals:** `#ffffff` with crisp `#e2e8f0` (`slate-200`) borders
- **Header & Primary Accents:** `#0f172a` (`slate-900`) and `#1e293b` (`slate-800`)
- **Text:** Primary `#0f172a` (`slate-900`), Secondary `#475569` (`slate-600`), Muted `#64748b` (`slate-500`)

### 3.2 Division Accents (Sub-Divisi)
- **Fueling System Engineering:**
  - Accent: Amber / Gold (`#d97706` / `text-amber-700`, `bg-amber-50`, `border-amber-200`)
  - Semantics: Dispensers, ATG, Underground tanks, calibration.
- **IT Engineering:**
  - Accent: Indigo / Blue (`#4f46e5` / `text-indigo-700`, `bg-indigo-50`, `border-indigo-200`)
  - Semantics: Networking, IoT sensors, server infrastructure, telemetry.
- **Electrical Engineering:**
  - Accent: Emerald (`#059669` / `text-emerald-700`, `bg-emerald-50`, `border-emerald-200`)
  - Semantics: Panel distribution, ATS, wiring, high-voltage maintenance.

### 3.3 Status Tokens
- **Done (Selesai):** `#047857` (`emerald-700`), badge background `#ecfdf5`, border `#a7f3d0`
- **Pending (Menunggu):** `#b45309` (`amber-700`), badge background `#fffbeb`, border `#fde68a`
- **Hold (Tertunda):** `#4338ca` (`indigo-700`), badge background `#eef2ff`, border `#c7d2fe`
- **Cancel (Batal):** `#be123c` (`rose-700`), badge background `#fff1f2`, border `#fecdd3`

---

## 4. Typography & Numerics
- **Body & Headings:** Inter / System UI sans-serif.
- **Monospace Accents:** Document numbers (`WO-EXT-2026-089`, `SPK/MKT-IT/2026/10/014`), Indonesian Rupiah currency values (`Rp 4.350.000`), phone numbers, and timestamps.
- **Contrast:** Strict WCAG AA compliance (text contrast >= 4.5:1).

---

## 5. Craftsmanship & Anti-Slop Discipline
- **No Em Dashes (`—`):** Use clean colons, bullets, parentheses, or separate lines.
- **No Invented Numbers:** All stats (Total WO, Active WO, Pending, Done, SPK count, Kasbon, SPD) derive dynamically from the real dataset.
- **No Fake Feed / Testimonials:** Every row is an actual operational task with genuine client contexts (Pertamina, Krakatau Posco, PLN, etc.).
- **Complete Interactive Controls:** Every button, filter, tab, calculation field, modal, and action works end-to-end.
- **Structured Drive Archiving:** Google Drive hierarchy directly mirrors the operational protocol specified in `prd.md`.
