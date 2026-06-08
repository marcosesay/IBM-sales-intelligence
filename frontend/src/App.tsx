import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import BriefingPage from "@/pages/BriefingPage";
import ArchitecturePage from "@/pages/ArchitecturePage";

// Configure API client to point to local API server
setBaseUrl("http://localhost:3000");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

function App() {
  // Simple routing based on URL path
  const path = window.location.pathname;
  
  return (
    <QueryClientProvider client={queryClient}>
      {path === "/architecture" ? <ArchitecturePage /> : <BriefingPage />}
    </QueryClientProvider>
  );
}

export default App;
