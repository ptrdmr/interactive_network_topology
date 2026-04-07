"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { TopologyWorkspace } from "@/components/topology/TopologyWorkspace";

function TopologyPageInner() {
  const params = useParams();
  const floorId = params.floorId as string;
  return <TopologyWorkspace floorId={floorId} />;
}

export default function TopologyPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-bg-primary text-text-muted text-sm">
          Loading topology…
        </div>
      }
    >
      <TopologyPageInner />
    </Suspense>
  );
}
