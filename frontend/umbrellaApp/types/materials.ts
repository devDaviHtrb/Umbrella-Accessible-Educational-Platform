export interface ModuleMaterial {
  id: number | string;
  title: string;
  status?: string;
  description?: string;
  size: number;
  moduleId: number | string;
  resourceType: 'image' | 'raw' | 'video' | string;
  url: string;
  fileType?: string;
  /** Id da entidade Video (só para materiais de vídeo); usado para legendas. */
  videoId?: number | string | null;
}
