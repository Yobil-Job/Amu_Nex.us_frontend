import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Clubs from "./pages/Clubs";
import Events from "./pages/Events";
import Fees from "./pages/Fees";
import Announcements from "./pages/Announcements";
import Authorities from "./pages/Authorities";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminJoinRequests from "./pages/admin/JoinRequests";
import AdminSettings from "./pages/admin/Settings";
import AdminSystemLogs from "./pages/admin/SystemLogs";
import AdminNotifications from "./pages/admin/Notifications";
import ClubAdminMembers from "./pages/club-admin/Members";
import ClubAdminJoinRequests from "./pages/club-admin/JoinRequests";
import ClubAdminAuthorities from "./pages/club-admin/Authorities";
import ClubAdminSettings from "./pages/club-admin/Settings";
import SuperUserMembers from "./pages/super-user/Members";
import SuperUserResources from "./pages/super-user/Resources";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><Students /></ProtectedRoute>} />
                <Route path="/clubs" element={<Clubs />} />
                <Route path="/events" element={<Events />} />
                <Route path="/fees" element={<Fees />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/authorities" element={<ProtectedRoute requiredRole={['SUPER_ADMIN', 'ADMIN']}><Authorities /></ProtectedRoute>} />
                <Route path="/join-requests" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><AdminJoinRequests /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><AdminSettings /></ProtectedRoute>} />
                <Route path="/system-logs" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><AdminSystemLogs /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><AdminNotifications /></ProtectedRoute>} />
                <Route path="/club-members" element={<ProtectedRoute requiredRole="ADMIN"><ClubAdminMembers /></ProtectedRoute>} />
                <Route path="/club-join-requests" element={<ProtectedRoute requiredRole="ADMIN"><ClubAdminJoinRequests /></ProtectedRoute>} />
                <Route path="/club-authorities" element={<ProtectedRoute requiredRole="ADMIN"><ClubAdminAuthorities /></ProtectedRoute>} />
                <Route path="/club-settings" element={<ProtectedRoute requiredRole="ADMIN"><ClubAdminSettings /></ProtectedRoute>} />
                <Route path="/members" element={<ProtectedRoute requiredRole="SUPER_USER"><SuperUserMembers /></ProtectedRoute>} />
                <Route path="/resources" element={<ProtectedRoute requiredRole="SUPER_USER"><SuperUserResources /></ProtectedRoute>} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
