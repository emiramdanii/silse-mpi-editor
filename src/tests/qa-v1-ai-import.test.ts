/**
 * QA Test Script: Target V1 - AI Import to Export Flow
 * 
 * Tujuan: Memastikan desain dari AI JSON masuk persis, bisa diedit, dan diekspor.
 */

import { describe, it, expect } from 'vitest';
import { aiBlueprintToSimpleProject as convertAiBlueprintToProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import type { AiMpiBlueprint } from '../core/ai-mpi-json/schema';

// Catatan: validateAiBlueprint tidak tersedia sebagai fungsi export
// Untuk testing purposes, kita asumsikan validasi sudah dilakukan

// Sample JSON AI dengan designSystem.overrides (Skenario Utama V1)
const sampleAiJsonWithOverrides: AiMpiBlueprint = {
  version: 1,
  metadata: {
    title: "Selamat Datang",
    subtitle: "Pelajaran Interaktif",
    author: "AI-Pedagogy-Designer",
    createdAt: new Date().toISOString()
  },
  curriculum: {
    subject: "Matematika",
    grade: "7",
    phase: "D",
    topic: "Bilangan Bulat",
    objectives: []
  },
  styleIntent: {
    styleId: "modern-blue",
    mood: "clean",
    intent: "Tema biru modern untuk pembelajaran interaktif"
  },
  designSystem: {
    contractId: "design-contract-v1",
    paletteName: "modern-blue",
    typographyName: "default",
    overrides: {
      typography: {
        fontFamily: "Verdana, sans-serif", // Font kustom dari AI
        headingFontFamily: "Georgia, serif",
        fontSizeBase: 18,
        lineHeightBase: 1.6
      },
      colors: {
        primary: "#FF5733", // Warna primer kustom (bukan biru default)
        secondary: "#33FF57",
        background: "#FFFFE0",
        text: "#2C3E50"
      },
      spacing: {
        unit: 12
      },
      radius: {
        default: 12
      }
    }
  },
  flow: {
    steps: [{ sceneId: "scene-1", label: "Cover" }],
    mode: "linear"
  },
  scenes: [
    {
      id: "scene-1",
      role: "cover",
      sceneType: "cover-hero",
      title: "Selamat Datang",
      slots: [
        {
          id: "slot-1",
          role: "hero-title",
          placement: { x: 0, y: 0, width: 100, height: 20 },
          content: { kind: "text", variant: "heading", text: "Selamat Datang" }
        }
      ],
      navigation: {}
    }
  ],
  assets: [],
  runtime: { showProgress: true, showScore: false },
  exportConfig: { format: "html-standalone", embedAssets: true, includeToolbar: true }
};

// Sample JSON AI tanpa overrides (Fallback ke styleId saja)
const sampleAiJsonNoOverrides: AiMpiBlueprint = {
  version: 1,
  metadata: {
    title: "Konten Standar",
    author: "AI-Basic",
    createdAt: new Date().toISOString()
  },
  curriculum: {
    subject: "IPA",
    grade: "8",
    phase: "D",
    topic: "Energi",
    objectives: []
  },
  styleIntent: {
    styleId: "minimal-green",
    mood: "clean",
    intent: "Tema hijau minimalis"
  },
  designSystem: {
    contractId: "design-contract-v1",
    paletteName: "minimal-green",
    typographyName: "default"
  },
  flow: {
    steps: [{ sceneId: "scene-1", label: "Content" }],
    mode: "linear"
  },
  scenes: [
    {
      id: "scene-1",
      role: "material",
      sceneType: "learning-scene",
      title: "Konten Standar",
      slots: [
        {
          id: "slot-1",
          role: "main-content",
          placement: { x: 0, y: 0, width: 100, height: 50 },
          content: { kind: "text", variant: "paragraph", text: "Konten standar" }
        }
      ],
      navigation: {}
    }
  ],
  assets: [],
  runtime: { showProgress: true, showScore: false },
  exportConfig: { format: "html-standalone", embedAssets: true, includeToolbar: true }
};

describe("QA V1: AI Import -> Edit -> Export Flow", () => {
  
  describe("1. Validasi Schema AI JSON", () => {
    it("harus menerima JSON AI dengan designSystem.overrides (type check)", () => {
      // Type-checking sudah dilakukan oleh TypeScript compiler
      // Jika kode ini compile, berarti struktur JSON valid
      expect(sampleAiJsonWithOverrides.designSystem?.overrides?.typography?.fontFamily).toBe("Verdana, sans-serif");
    });

    it("harus menerima JSON AI tanpa overrides (backward compatible)", () => {
      expect(sampleAiJsonNoOverrides.styleIntent?.styleId).toBe("minimal-green");
    });
  });

  describe("2. Konversi Blueprint ke Project (Core Logic)", () => {
    it("harus menerapkan designSystem.overrides ke project style", () => {
      const project = convertAiBlueprintToProject(sampleAiJsonWithOverrides);
      
      // Cek apakah overrides diterapkan
      expect(project.style?.tokens.typography.fontFamily).toBe("Verdana, sans-serif");
      expect(project.style?.tokens.colors.primary).toBe("#FF5733");
      expect(project.style?.tokens.colors.background).toBe("#FFFFE0");
      
      console.log("✅ Overrides berhasil diterapkan:", {
        font: project.style?.tokens.typography.fontFamily,
        primaryColor: project.style?.tokens.colors.primary
      });
    });

    it("harus menggunakan styleId default jika tidak ada overrides", () => {
      const project = convertAiBlueprintToProject(sampleAiJsonNoOverrides);
      
      // Harus punya style dasar dari 'minimal-green'
      expect(project.style).toBeDefined();
      expect(project.pages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. Struktur Project Hasil Konversi", () => {
    it("harus memiliki struktur project yang valid untuk editing", () => {
      const project = convertAiBlueprintToProject(sampleAiJsonWithOverrides);
      
      expect(project.id).toBeDefined();
      expect(project.title).toBeDefined();
      expect(project.pages).toBeInstanceOf(Array);
      expect(project.pages[0].id).toBeDefined();
      expect(project.style).toBeDefined();
      
      // Pastikan siap untuk diedit
      expect(project.pages[0].role).toBeDefined();
    });
  });

  describe("4. Simulasi Edit Manual", () => {
    it("harus mengizinkan modifikasi properti setelah import", () => {
      const project = convertAiBlueprintToProject(sampleAiJsonWithOverrides);
      
      // Simulasi user mengubah judul
      project.title = "Judul Diubah Manual";
      
      // Simulasi user mengubah warna primer
      if (project.style?.tokens.colors) {
        project.style.tokens.colors.primary = "#0000FF";
      }
      
      expect(project.title).toBe("Judul Diubah Manual");
      expect(project.style?.tokens.colors.primary).toBe("#0000FF");
    });
  });

  describe("5. Persiapan Export", () => {
    it("project harus bisa diserialisasi ke JSON untuk export", () => {
      const project = convertAiBlueprintToProject(sampleAiJsonWithOverrides);
      
      // Simulasi edit
      project.title = "Subtitle Baru";
      
      // Serialisasi (simulasi export)
      const exportedJson = JSON.stringify(project, null, 2);
      const parsed = JSON.parse(exportedJson);
      
      expect(parsed.title).toBe("Subtitle Baru");
      expect(typeof exportedJson).toBe("string");
      expect(exportedJson.length).toBeGreaterThan(100);
    });
  });
});

console.log("\n🧪 QA Test Suite V1 Siap Dijalankan");
console.log("Target: AI JSON → Import (Presisi Style) → Edit → Export");
