import { Component, JSX } from 'solid-js'; // Added Component and JSX

type LucideIconProps = {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
} & JSX.SvgSVGAttributes<SVGSVGElement>;

export type LucideIconComponent = Component<LucideIconProps>;
