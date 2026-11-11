import {
  MEDIA_CORRECTION_MODES,
  buildColorMatrixValues,
  mediaFilterId,
} from '@/utils/color-blind-media';

export function ColorBlindFilterDefs() {
  return (
    <svg
      width={0}
      height={0}
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      <defs>
        {MEDIA_CORRECTION_MODES.map((mode) => (
          <filter key={mode} id={mediaFilterId(mode)} colorInterpolationFilters="linearRGB">
            <feColorMatrix type="matrix" values={buildColorMatrixValues(mode)} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
