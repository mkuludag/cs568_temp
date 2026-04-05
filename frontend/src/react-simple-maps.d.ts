declare module "react-simple-maps" {
  import { ComponentType, ReactNode, CSSProperties } from "react";

  interface ProjectionConfig {
    rotate?: [number, number, number];
    scale?: number;
    center?: [number, number];
  }

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    children?: ReactNode;
  }

  interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    children?: ReactNode;
  }

  interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (data: { geographies: GeographyData[] }) => ReactNode;
  }

  interface GeographyData {
    rsmKey: string;
    id: string;
    properties: Record<string, unknown>;
  }

  interface GeographyStyleProps {
    default?: CSSProperties;
    hover?: CSSProperties;
    pressed?: CSSProperties;
  }

  interface GeographyProps {
    geography: GeographyData;
    key?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: GeographyStyleProps;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
}
