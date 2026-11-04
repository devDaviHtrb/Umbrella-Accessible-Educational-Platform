import type { MaterialKind } from '@/types/professor';

export type PickedFile = {
  id: string;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  blob?: Blob;
  uri?: string;
};

export type FileDropzoneProps = {
  kind: MaterialKind;
  files: PickedFile[];
  onChange: (files: PickedFile[]) => void;
  disabled?: boolean;
};