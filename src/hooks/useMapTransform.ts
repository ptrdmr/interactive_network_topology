"use client";

import { useState, useCallback, useRef, type WheelEvent, type MouseEvent, type TouchEvent } from "react";

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 4;
const ZOOM_SENSITIVITY = 0.001;

export function useMapTransform() {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
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
    isPanning.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPosition.current.x;
    const dy = e.clientY - lastPosition.current.y;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      isPanning.current = true;
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1 && isPanning.current) {
      const dx = e.touches[0].clientX - lastPosition.current.x;
      const dy = e.touches[0].clientY - lastPosition.current.y;
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
  };
}
