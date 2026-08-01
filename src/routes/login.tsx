import { createFileRoute, Navigate } from "@tanstack/react-router";

// Legacy route — everyone goes to /auth now.
export const Route = createFileRoute("/login")({
  component: () => <Navigate to="/auth" replace />,
});
