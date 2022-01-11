import extractColor, { integerColor } from './extractColor';
import { Color, ProcessedDynamicColor } from './types';

const urlIdPattern = /^url\(#(.+)\)$/;

const currentColorBrush = [2];
const contextFillBrush = [3];
const contextStrokeBrush = [4];

export default function extractBrush(color?: Color) {
  if (typeof color === 'number') {
    if (color >>> 0 === color && color >= 0 && color <= 0xffffffff) {
      return integerColor(color);
    }
  }

  if (!color || color === 'none') {
    return null;
  }

  if (color === 'currentColor') {
    return currentColorBrush;
  }

  if (color === 'context-fill') {
    return contextFillBrush;
  }

  if (color === 'context-stroke') {
    return contextStrokeBrush;
  }

  const brush = typeof color === 'string' && color.match(urlIdPattern);
  if (brush) {
    return [1, brush[1]];
  }

  const int32ARGBColor = extractColor(color);
  if (typeof int32ARGBColor === 'number') {
    return int32ARGBColor;
  }
  if (typeof color === 'string') {
    if (color.indexOf('semantic|') === 0) {
      return [0, { semantic: color.split('|').slice(1) }];
    } else if (color.indexOf('resource_paths|') === 0) {
      return [0, { resource_paths: color.split('|').slice(1) }];
    } else if (color.indexOf('dynamic|') === 0) {
      let items = color.split('|');
      let processedColor: ProcessedDynamicColor = {
        dynamic: {
          light: extractColor(items[1]) as number,
          dark: extractColor(items[2]) as number,
        },
      };
      if (items[3]) {
        processedColor.dynamic.highContrastLight = extractColor(
          items[3],
        ) as number;
      }
      if (items[4]) {
        processedColor.dynamic.highContrastDark = extractColor(
          items[4],
        ) as number;
      }
      return [0, processedColor];
    }
  }

  if (typeof color === 'object' && color !== null) {
    // iOS PlatformColor
    if ('semantic' in color) {
      return [0, color];
    }

    if ('dynamic' in color) {
      let processedColor: ProcessedDynamicColor = {
        dynamic: {
          light: extractColor(color.dynamic.light) as number,
          dark: extractColor(color.dynamic.dark) as number,
        },
      };
      if (color.dynamic.highContrastLight) {
        processedColor.dynamic.highContrastLight = extractColor(
          color.dynamic.highContrastLight,
        ) as number;
      }
      if (color.dynamic.highContrastDark) {
        processedColor.dynamic.highContrastDark = extractColor(
          color.dynamic.highContrastDark,
        ) as number;
      }
      return [0, processedColor];
    }

    // Android PlatformColor
    if ('resource_paths' in color) {
      return [0, color];
    }
  }

  console.warn(`"${color}" is not a valid color or brush`);
  return null;
}
