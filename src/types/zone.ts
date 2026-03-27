export interface ZoneBounds {
  type: "rect" | "path";
  x: number;
  y: number;
  width: number;
  height: number;
  path?: string;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  bounds: ZoneBounds;
  color: string;
}
