import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@/lib/api-client";
import { useEffect } from "react";
import BriefingPage from "@/pages/BriefingPage";
import ArchitecturePage from "@/pages/ArchitecturePage";
import ProspectPage from "@/pages/ProspectPage";

// Configure API client to point to local API server
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

function App() {
  const path = window.location.pathname;

  useEffect(() => {
    setBaseUrl(import.meta.env.VITE_BACKEND_URL || "");
  }, []);

  // Render appropriate page based on path
  const renderPage = () => {
    if (path === "/prospect") return <ProspectPage />;
    if (path === "/architecture") return <ArchitecturePage />;
    return <BriefingPage />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      {renderPage()}
    </QueryClientProvider>
  );
}

export default App;

// Made with Bob
