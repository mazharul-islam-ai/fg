import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

/**
 * Lazy route pages keep the initial bundle small.
 * Add new features as lazy(() => import("@/pages/...")) under Routes.
 */
const HomePage = lazy(() => import("@/pages/HomePage"));
const CompositionDemoPage = lazy(() => import("@/pages/CompositionDemoPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Loadingâ¦
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/composition" element={<CompositionDemoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
