import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { AuthProvider } from "@/auth/AuthContext";
import DraftPersistence from "@/components/DraftPersistence";
import { routerBasename } from "@/utils/appPaths";
import Index from "./pages/Index";
import Preview from "./pages/Preview";
import ConfigJson from "./pages/ConfigJson";
import Apps from "./pages/Apps";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import RelocationNotice from "./pages/RelocationNotice";
import { shouldShowRelocationNotice } from "@/utils/siteRedirect";

const queryClient = new QueryClient();

const App = () => {
  if (shouldShowRelocationNotice()) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RelocationNotice />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConfigProvider>
          <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={routerBasename()}>
            <DraftPersistence>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/preview" element={<Preview />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/config.json" element={<ConfigJson />} />
              <Route path="/callback" element={<AuthCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </DraftPersistence>
          </BrowserRouter>
          </AuthProvider>
        </ConfigProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
