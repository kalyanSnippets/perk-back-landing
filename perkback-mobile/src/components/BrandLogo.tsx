import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const logo = require('../../assets/perkback-logo.png');
const favicon = require('../../assets/perkback-favicon.png');

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
  return (
    <View style={[styles.wrap, { width, height }, style]}>
      <Image
        source={variant === 'full' ? logo : favicon}
        resizeMode="contain"
        style={[styles.image, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
