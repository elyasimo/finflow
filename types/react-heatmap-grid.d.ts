declare module 'react-heatmap-grid' {
  interface HeatMapGridProps {
    data: (number | null)[][];
    xLabels: string[];
    yLabels: string[];
    cellRender?: (x: number, y: number, value: number | null) => string;
    cellStyle?: (x: number, y: number, value: number | null) => React.CSSProperties;
    xLabelsStyle?: () => React.CSSProperties;
    yLabelsStyle?: () => React.CSSProperties;
    square?: boolean;
  }
  const HeatMapGrid: React.FC<HeatMapGridProps>;
  export default HeatMapGrid;
} 