import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@/lib/api-client";
import { useEffect, useState } from "react";
import BriefingPage from "@/pages/BriefingPage";
import ArchitecturePage from "@/pages/ArchitecturePage";
import SetupPage from "@/pages/SetupPage";
import ProspectPage from "@/pages/ProspectPage";

// Configure API client to point to local API server
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

function App() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const path = window.location.pathname;

  // Render prospect page immediately — no setup check needed
  if (path === "/prospect") {
    return (
      <QueryClientProvider client={queryClient}>
        <ProspectPage />
      </QueryClientProvider>
    );
  }

  useEffect(() => {
    setBaseUrl(import.meta.env.VITE_BACKEND_URL || "");

    // Check if user has completed setup
    const userName = localStorage.getItem("userName");
    const userRole = localStorage.getItem("userRole");
    setIsSetupComplete(!!(userName && userRole));
  }, []);

  // Show loading state while checking setup status
  if (isSetupComplete === null) {
    return null;
  }

  // If setup is not complete and not on setup page, redirect to setup
  if (!isSetupComplete && path !== "/setup") {
    window.location.href = "/setup";
    return null;
  }

  // Render appropriate page based on path
  const renderPage = () => {
    if (path === "/setup") {
      return <SetupPage />;
    }
    if (path === "/architecture") {
      return <ArchitecturePage />;
    }
    return <BriefingPage />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      {renderPage()}
    </QueryClientProvider>
  );
}

export default App;
