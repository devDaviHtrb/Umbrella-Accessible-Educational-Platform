import {
  MATERIAL_FILE_BLOCKED_EXTENSIONS,
  MATERIAL_FILE_MAX_COUNT,
  materialFileRules,
} from '@/constants/material-files';
import type { PickedFile } from '@/types/files';
import type { MaterialKind } from '@/types/professor';

export type IncomingFile = {
  name: string;
  size: number;
  type: string;
  blob?: Blob;
  uri?: string;
};

export function getFileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : '';
}

export function fileBaseName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, '').trim();
  return base || name;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

let sequence = 0;

function unsupportedMessage(name: string, extension: string, kind: MaterialKind): string {
  const accepted = `arquivos ${materialFileRules[kind].typeLabel}`;
  const intro = extension
    ? `"${name}" não é compatível: este espaço aceita apenas ${accepted}.`
    : `"${name}" não tem uma extensão reconhecida: este espaço aceita apenas ${accepted}.`;

  const otherKind = (Object.keys(materialFileRules) as MaterialKind[]).find(
    (candidate) => candidate !== kind && materialFileRules[candidate].extensions.includes(extension),
  );

  return otherKind
    ? `${intro} Para esse formato, escolha o tipo ${materialFileRules[otherKind].kindLabel}.`
    : intro;
}

export function describeAcceptedFormats(kind: MaterialKind): string {
  const rule = materialFileRules[kind];
  const limit = rule.maxBytes !== undefined ? ` • até ${formatFileSize(rule.maxBytes)} cada` : '';
  return `Formatos aceitos: ${rule.typeLabel}${limit}`;
}

export function acceptMaterialFiles(
  incoming: IncomingFile[],
  kind: MaterialKind,
  existing: PickedFile[],
): { accepted: PickedFile[]; errors: string[] } {
  const rule = materialFileRules[kind];
  const accepted: PickedFile[] = [];
  const errors: string[] = [];

  for (const file of incoming) {
    const extension = getFileExtension(file.name);

    if (MATERIAL_FILE_BLOCKED_EXTENSIONS.includes(extension)) {
      errors.push(`"${file.name}" não pode ser enviado: o formato .${extension} é bloqueado.`);
      continue;
    }
    if (!rule.extensions.includes(extension)) {
      errors.push(unsupportedMessage(file.name, extension, kind));
      continue;
    }
    if (file.size === 0) {
      errors.push(`"${file.name}" está vazio.`);
      continue;
    }
    if (rule.maxBytes !== undefined && file.size > rule.maxBytes) {
      errors.push(
        `"${file.name}" tem ${formatFileSize(file.size)}, acima do limite de ${formatFileSize(rule.maxBytes)} por arquivo.`,
      );
      continue;
    }
    if ([...existing, ...accepted].some((item) => item.name === file.name && item.size === file.size)) {
      errors.push(`"${file.name}" já foi adicionado.`);
      continue;
    }
    if (existing.length + accepted.length >= MATERIAL_FILE_MAX_COUNT) {
      errors.push(`Você pode adicionar até ${MATERIAL_FILE_MAX_COUNT} arquivos por vez.`);
      break;
    }

    sequence += 1;
    accepted.push({
      id: `arquivo-${Date.now()}-${sequence}`,
      name: file.name,
      size: file.size,
      extension,
      mimeType: file.type,
      blob: file.blob,
      uri: file.uri,
    });
  }

  return { accepted, errors };
}

export function resolveFileUrl(file: PickedFile): string {
  if (file.uri) return file.uri;
  if (file.blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(file.blob);
  }
  return '';
}
