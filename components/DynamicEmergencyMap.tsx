"use client";

import dynamic from "next/dynamic";

const EmergencyMap = dynamic(() => import("./EmergencyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-zinc-100 rounded-xl border border-zinc-200 flex items-center justify-center">
      <p className="text-xs text-zinc-500 font-medium animate-pulse">
        Loading OpenStreetMap...
      </p>
    </div>
  ),
});

export default EmergencyMap;
