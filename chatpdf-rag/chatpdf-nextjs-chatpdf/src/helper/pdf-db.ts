import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const MEMORY_DIR = path.join(ROOT, "public", "pdf-database");
const HISTORY_FILE = path.join(MEMORY_DIR, "pdf-db.json");

type PdfEntry = {
  pdfId: string;
  title: string;
};

/* ----------------------------------------
   Ensure storage exists
----------------------------------------- */
function ensureStorage() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }

  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

/* ----------------------------------------
   Read database
----------------------------------------- */
function readDatabase(): PdfEntry[] {
  ensureStorage();
  const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
  return JSON.parse(raw || "[]");
}

/* ----------------------------------------
   Write database
----------------------------------------- */
function writeDatabase(data: PdfEntry[]) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/* ----------------------------------------
   CREATE: Add new PDF
----------------------------------------- */
export function addPdf(title: string,pdfId:string): PdfEntry {
  const db = readDatabase();

  const newPdf: PdfEntry = {
    pdfId,
    title,
  };

  db.push(newPdf);
  writeDatabase(db);

  return newPdf;
}

/* ----------------------------------------
   READ: Get all PDFs
----------------------------------------- */
export function getAllPdfs(): PdfEntry[] {
  return readDatabase();
}
