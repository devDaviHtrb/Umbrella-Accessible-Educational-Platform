import type { ColorBlindMode } from '@/constants/preferences';

export type MediaCorrectionMode = Extract<ColorBlindMode, 'protanopia' | 'deuteranopia' | 'tritanopia'>;

type Matrix3 = [[number, number, number], [number, number, number], [number, number, number]];

const SIMULATION: Record<MediaCorrectionMode, Matrix3> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const ERROR_SHIFT: Record<MediaCorrectionMode, Matrix3> = {
  protanopia: [
    [0, 0, 0],
    [0.7, 1, 0],
    [0.7, 0, 1],
  ],
  deuteranopia: [
    [0, 0, 0],
    [0.7, 1, 0],
    [0.7, 0, 1],
  ],
  tritanopia: [
    [1, 0, 0.7],
    [0, 1, 0.7],
    [0, 0, 0],
  ],
};

export const MEDIA_CORRECTION_MODES: MediaCorrectionMode[] = ['protanopia', 'deuteranopia', 'tritanopia'];

export function isMediaCorrectionMode(mode: ColorBlindMode): mode is MediaCorrectionMode {
  return (MEDIA_CORRECTION_MODES as ColorBlindMode[]).includes(mode);
}

export function buildCorrectionMatrix(mode: MediaCorrectionMode): Matrix3 {
  const simulation = SIMULATION[mode];
  const shift = ERROR_SHIFT[mode];
  const error = simulation.map((row, i) => row.map((value, j) => (i === j ? 1 : 0) - value));
  return shift.map((row, i) =>
    row.map((_, j) => (i === j ? 1 : 0) + row.reduce((sum, weight, k) => sum + weight * error[k][j], 0)),
  ) as Matrix3;
}

export function buildColorMatrixValues(mode: MediaCorrectionMode): string {
  const [r, g, b] = buildCorrectionMatrix(mode);
  const format = (row: number[]) => `${row.map((value) => value.toFixed(6)).join(' ')} 0 0`;
  return `${format(r)} ${format(g)} ${format(b)} 0 0 0 1 0`;
}

export function mediaFilterId(mode: MediaCorrectionMode) {
  return `umbrella-media-${mode}`;
}

export function buildMediaFilter(mode: ColorBlindMode, platform: string): string | undefined {
  if (platform !== 'web' || !isMediaCorrectionMode(mode)) return undefined;
  return `url(#${mediaFilterId(mode)})`;
}
