export interface DriveFolderStructure {
  rootFolder: string;
  yearFolder: string;
  subdivFolder: string;
  projectFolder: string;
  baFolder: string;
  photoFolder: string;
  fullPath: string;
}

export function buildDriveFolderPath(
  year: string | number,
  subdiv: string,
  docType: string,
  docNumber: string,
  customer: string
): DriveFolderStructure {
  const rootFolder = "101 - Dashboard Master ME Engineering";
  const yearFolder = String(year);
  const subdivFolder = subdiv;
  const projectFolder = `[${docType}-${docNumber}] ${customer}`;
  const baFolder = `${projectFolder}/Berita_Acara`;
  const photoFolder = `${projectFolder}/Foto_Dokumentasi`;
  const fullPath = `${rootFolder} / ${yearFolder} / ${subdivFolder} / ${projectFolder}`;

  return {
    rootFolder,
    yearFolder,
    subdivFolder,
    projectFolder,
    baFolder,
    photoFolder,
    fullPath
  };
}

export function generateDriveMockFileUrl(
  docNumber: string, 
  fileName: string, 
  type: "BA" | "PHOTO"
): string {
  const sanitizedDoc = docNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
  const encodedFile = encodeURIComponent(fileName);
  return `https://drive.google.com/drive/folders/internal-me-it/${sanitizedDoc}/${type}?file=${encodedFile}`;
}
