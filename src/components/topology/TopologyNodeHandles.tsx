"use client";

import { Fragment } from "react";
import { Handle, Position } from "@xyflow/react";

const handleClass = "!size-2 !border-border !bg-bg-secondary";

const SIDES = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
] as const;

/**
 * Four sides × source + target so edges can attach on the face nearest the peer.
 * Ids: `s-top` … `s-left`, `t-top` … `t-left`.
 */
export function TopologyNodeHandles() {
  return (
    <>
      {SIDES.map((pos) => (
        <Fragment key={pos}>
          <Handle
            type="source"
            position={pos}
            id={`s-${pos}`}
            className={handleClass}
          />
          <Handle
            type="target"
            position={pos}
            id={`t-${pos}`}
            className={handleClass}
          />
        </Fragment>
      ))}
    </>
  );
}
