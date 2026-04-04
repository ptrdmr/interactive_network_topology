"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { MapWorkspace } from "@/components/map/MapWorkspace";

function MapPageInner() {
  const params = useParams();
  const floorId = params.floorId as string;
  return <MapWorkspace floorId={floorId} />;
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-bg-primary text-text-muted text-sm">
          Loading map…
        </div>
      }
    >
      <MapPageInner />
    </Suspense>
  );
}
