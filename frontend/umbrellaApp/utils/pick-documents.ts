import * as DocumentPicker from 'expo-document-picker';

import { materialFileRules } from '@/constants/material-files';
import type { PickedFile } from '@/types/files';
import type { MaterialKind } from '@/types/professor';
import { acceptMaterialFiles, type IncomingFile } from '@/utils/files';

export type DocumentPickOutcome = {
  canceled: boolean;
  accepted: PickedFile[];
  errors: string[];
};

export async function pickMaterialDocuments(
  kind: MaterialKind,
  existing: PickedFile[],
): Promise<DocumentPickOutcome> {
  const rule = materialFileRules[kind];

  const result = await DocumentPicker.getDocumentAsync({
    type: rule.mimeTypes,
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled) return { canceled: true, accepted: [], errors: [] };

  const incoming: IncomingFile[] = [];
  const errors: string[] = [];

  for (const asset of result.assets) {
    if (typeof asset.size !== 'number') {
      errors.push(`Não foi possível ler o tamanho de "${asset.name}". Tente selecioná-lo novamente.`);
      continue;
    }

    incoming.push({
      name: asset.name,
      size: asset.size,
      type: asset.mimeType ?? '',
      uri: asset.uri,
    });
  }

  const { accepted, errors: rejected } = acceptMaterialFiles(incoming, kind, existing);
  return { canceled: false, accepted, errors: [...errors, ...rejected] };
}