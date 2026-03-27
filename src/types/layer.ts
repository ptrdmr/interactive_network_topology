/** Standard map layer vs server rack layer (map dot = enclosure; stack units inside). */
export type LayerKind = "standard" | "server";

export interface Layer {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  visible: boolean;
  kind: LayerKind;
}
