import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '../theme';

/** One line-icon set: 24 grid, 1.75 stroke, round caps. */
export type IconName =
  | 'back'
  | 'settings'
  | 'undo'
  | 'restart'
  | 'help'
  | 'stats'
  | 'chevronRight'
  | 'arrowRight'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'spark'
  | 'play'
  | 'trophy'
  | 'plus';

const PATHS: Record<Exclude<IconName, 'settings' | 'stats' | 'help' | 'spark' | 'play'>, string> = {
  back: 'M14.5 5.5 8 12l6.5 6.5',
  undo: 'M9 7.5 5 11.5l4 4M5.5 11.5h8.25a4.75 4.75 0 0 1 0 9.5H11',
  restart: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4',
  chevronRight: 'M9.5 6l6 6-6 6',
  arrowRight: 'M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5',
  up: 'M12 18.5V5.5M6.5 11 12 5.5l5.5 5.5',
  down: 'M12 5.5v13M6.5 13l5.5 5.5 5.5-5.5',
  left: 'M18.5 12h-13M11 6.5 5.5 12l5.5 5.5',
  right: 'M5.5 12h13M13 6.5l5.5 5.5-5.5 5.5',
  trophy: 'M8 4.5h8v5a4 4 0 0 1-8 0v-5ZM8 6.5H5.5v1.5A3 3 0 0 0 8.4 11M16 6.5h2.5v1.5a3 3 0 0 1-2.9 3M12 13.5v3.5M8.5 19.5h7M10 17h4',
  plus: 'M12 5.5v13M5.5 12h13',
};

export function Icon({ name, size = 22, color = colors.text.secondary, strokeWidth = 1.75 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'settings' ? (
        <>
          <Path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" {...common} />
          <Circle cx={15} cy={7.5} r={2} {...common} />
          <Circle cx={9} cy={16.5} r={2} {...common} />
        </>
      ) : name === 'stats' ? (
        <>
          <Path d="M5 19.5V13M12 19.5V5M19 19.5v-9" {...common} />
        </>
      ) : name === 'help' ? (
        <>
          <Circle cx={12} cy={12} r={8.5} {...common} />
          <Path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" {...common} />
          <Circle cx={12} cy={16.6} r={0.4} {...common} fill={color} />
        </>
      ) : name === 'play' ? (
        <Path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l10.6-6.8a1 1 0 0 0 0-1.72L9.5 4.34A1 1 0 0 0 8 5.2Z" fill={color} stroke="none" />
      ) : name === 'spark' ? (
        <Path d="M12 3.5c.5 4.4 1.9 6.6 8.5 8.5-6.6 1.9-8 4.1-8.5 8.5-.5-4.4-1.9-6.6-8.5-8.5 6.6-1.9 8-4.1 8.5-8.5Z" fill={color} stroke="none" />
      ) : (
        <Path d={PATHS[name]} {...common} />
      )}
    </Svg>
  );
}

/** Brand symbol: two offset squares with a slit of light between them. */
export function BrandMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2.5} y={6.5} width={12} height={12} rx={3.4} fill={colors.aurora.emerald} opacity={0.9} />
      <Rect x={9.5} y={2.5} width={12} height={12} rx={3.4} fill={colors.aurora.lavender} opacity={0.92} />
      <Rect x={9.5} y={6.5} width={5} height={8} fill={colors.aurora.mint} />
    </Svg>
  );
}
