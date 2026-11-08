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
}
