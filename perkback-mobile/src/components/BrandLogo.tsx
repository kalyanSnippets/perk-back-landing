import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const logo = require('../../assets/perkback-logo.png');
const favicon = require('../../assets/perkback-favicon.png');

const LOGO_CROP = {
  sourceWidth: 1536,
  sourceHeight: 1024,
  visibleX: 272,
  visibleY: 354,
  visibleWidth: 977,
  visibleHeight: 229,
};

type BrandLogoProps = {
  variant?: 'full' | 'mark';
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function BrandLogo({
  variant = 'full',
  width = variant === 'full' ? 188 : 96,
  height = variant === 'full' ? 70 : 96,
  style,
  imageStyle,
}: BrandLogoProps) {
  const scale = width / LOGO_CROP.visibleWidth;
  const fullLogoStyle =
    variant === 'full'
      ? {
          width: LOGO_CROP.sourceWidth * scale,
          height: LOGO_CROP.sourceHeight * scale,
          left: -LOGO_CROP.visibleX * scale,
          top: (height - LOGO_CROP.visibleHeight * scale) / 2 - LOGO_CROP.visibleY * scale,
        }
      : null;

  return (
    <View style={[styles.wrap, { width, height }, style]}>
      <Image
        source={variant === 'full' ? logo : favicon}
        resizeMode="contain"
        style={[variant === 'full' ? styles.fullImage : styles.image, fullLogoStyle, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fullImage: {
    position: 'absolute',
  },
});
