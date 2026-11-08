import type { MaterialKind } from '@/types/professor';

export const MATERIAL_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const MATERIAL_VIDEO_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const MATERIAL_FILE_MAX_COUNT = 10;

export const MATERIAL_FILE_BLOCKED_EXTENSIONS = ['exe', 'bat', 'cmd', 'gif'];

export type MaterialFileRule = {
  extensions: string[];
  mimeTypes: string[];
  maxBytes?: number;
  typeLabel: string;
  kindLabel: string;
};

export const materialFileRules: Record<MaterialKind, MaterialFileRule> = {
  documents: {
    extensions: ['pdf', 'doc', 'docx', 'odt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
    ],
    maxBytes: MATERIAL_FILE_MAX_BYTES,
    typeLabel: 'PDF, DOC, DOCX ou ODT',
    kindLabel: 'Documentos',
  },
  slides: {
    extensions: ['ppt', 'pptx', 'odp'],
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.presentation',
    ],
    maxBytes: MATERIAL_FILE_MAX_BYTES,
    typeLabel: 'PPT, PPTX ou ODP',
    kindLabel: 'Slides',
  },
  images: {
    extensions: ['jpg', 'jpeg', 'png'],
    mimeTypes: ['image/jpeg', 'image/png'],
    maxBytes: MATERIAL_FILE_MAX_BYTES,
    typeLabel: 'JPG, JPEG ou PNG',
    kindLabel: 'Imagens',
  },
  spreadsheets: {
    extensions: ['xlsx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxBytes: MATERIAL_FILE_MAX_BYTES,
    typeLabel: 'XLSX',
    kindLabel: 'Planilhas',
  },
  videos: {
    extensions: ['mp4'],
    mimeTypes: ['video/mp4'],
    maxBytes: MATERIAL_VIDEO_FILE_MAX_BYTES,
    typeLabel: 'MP4',
    kindLabel: 'Vídeos',
  },
};