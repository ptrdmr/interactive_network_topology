"use client";

import {
  useState,
  useCallback,
  useRef,
  type WheelEvent,
  type MouseEvent,
  type TouchEvent,
} from "react";

export interface MapTransform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 4;
const ZOOM_SENSITIVITY = 0.001;
/** Pixels of movement before panning starts (reduces accidental pan vs tap). */
const PAN_THRESHOLD_PX = 7;

export function useMapTransform() {
  const [transform, setTransform] = useState<MapTransform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const panCandidate = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const lastPinchDistance = useRef<number | null>(null);

  const containerRef = useRef<HTMLElement | null>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement | null;
    if (target) containerRef.current = target;
    const el = containerRef.current;
    if (!el) return;

    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const rect = el.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform((prev) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * (1 + delta)));
      const ratio = newScale / prev.scale;
      return {
        x: mouseX - (mouseX - prev.x) * ratio,
        y: mouseY - (mouseY - prev.y) * ratio,
        scale: newScale,
      };
    });
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    panCandidate.current = true;
    isPanning.current = false;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    panStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!panCandidate.current) return;
    const dx = e.clientX - lastPosition.current.x;
    const dy = e.clientY - lastPosition.current.y;
    if (!isPanning.current) {
      const ox = e.clientX - panStart.current.x;
      const oy = e.clientY - panStart.current.y;
      if (ox * ox + oy * oy < PAN_THRESHOLD_PX * PAN_THRESHOLD_PX) return;
      isPanning.current = true;
    }
    lastPosition.current = { x: e.clientX, y: e.clientY };
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    panCandidate.current = false;
    isPanning.current = false;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      panCandidate.current = true;
      isPanning.current = false;
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      panCandidate.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1 && panCandidate.current) {
      const dx = e.touches[0].clientX - lastPosition.current.x;
      const dy = e.touches[0].clientY - lastPosition.current.y;
      if (!isPanning.current) {
        const ox = e.touches[0].clientX - panStart.current.x;
        const oy = e.touches[0].clientY - panStart.current.y;
        if (ox * ox + oy * oy < PAN_THRESHOLD_PX * PAN_THRESHOLD_PX) return;
        isPanning.current = true;
      }
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    } else if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = (distance - lastPinchDistance.current) * 0.01;
      lastPinchDistance.current = distance;
      setTransform((prev) => ({
        ...prev,
        scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * (1 + delta))),
      }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    panCandidate.current = false;
    isPanning.current = false;
    lastPinchDistance.current = null;
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale * 1.3),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale / 1.3),
    }));
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  /** Fit unscaled content of size (contentW, contentH) into the container rect with padding. */
  const fitContentToContainer = useCallback(
    (containerWidth: number, containerHeight: number, contentWidth: number, contentHeight: number) => {
      const pad = 24;
      const cw = Math.max(1, containerWidth - pad * 2);
      const ch = Math.max(1, containerHeight - pad * 2);
      const s = Math.min(cw / contentWidth, ch / contentHeight, MAX_SCALE);
      const scaledW = contentWidth * s;
      const scaledH = contentHeight * s;
      const x = (containerWidth - scaledW) / 2;
      const y = (containerHeight - scaledH) / 2;
      setTransform({ x, y, scale: s });
    },
    []
  );

  return {
    transform,
    handlers: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    zoomIn,
    zoomOut,
    resetView,
    fitContentToContainer,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  };
}
