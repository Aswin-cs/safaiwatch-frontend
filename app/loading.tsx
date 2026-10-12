import React from "react";
import SplashLoader from "@/components/SplashLoader";

export default function Loading() {
  return (
    <SplashLoader
      title="SafaiWatch"
      subtitle="Loading civic network telemetry…"
      showProgress
    />
  );
}
