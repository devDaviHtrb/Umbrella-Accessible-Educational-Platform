import { useState } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { ColorBlindMedia } from '@/components/ui/color-blind-media';

const logoContext = require.context('../../assets/images', false, /^\.\/logo-umbrella\.(png|webp|jpg|jpeg)$/);
const logoKey = logoContext.keys()[0];
const logoSource: ImageSourcePropType | undefined = logoKey ? logoContext(logoKey) : undefined;
const logoSize =
  logoSource && typeof Image.resolveAssetSource === 'function' ? Image.resolveAssetSource(logoSource) : undefined;
const initialAspectRatio = logoSize?.width && logoSize.height ? logoSize.width / logoSize.height : 1;

export const hasUmbrellaLogo = !!logoSource;

type UmbrellaLogoProps = {
  height?: number;
  centered?: boolean;
};

export function UmbrellaLogo({ height = 64, centered = false }: UmbrellaLogoProps) {
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);

  if (!logoSource) return null;

  return (
    <View style={centered ? styles.centered : styles.start}>
      <ColorBlindMedia>
        <Image
          source={logoSource}
          accessibilityRole="image"
          accessibilityLabel="Umbrella"
          resizeMode="contain"
          style={{ height, aspectRatio }}
          onLoad={({ nativeEvent }) => {
            const width = nativeEvent?.source?.width;
            const loadedHeight = nativeEvent?.source?.height;
            if (width && loadedHeight) setAspectRatio(width / loadedHeight);
          }}
        />
      </ColorBlindMedia>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  start: {
    alignItems: 'flex-start',
  },
});
