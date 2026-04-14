import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

// layouts
import AdminLayout from "../layouts/AdminLayout";
import CompanyLayout from "../layouts/CompanyLayout";
import UserLayout from "../pages/user/UserLayout";

// pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ResetPassword from "../pages/auth/ResetPassword";
import AdminDashboard from "../pages/admin/Dashboard";
import CompanyDashboard from "../pages/company/Dashboard";
import Users from "../pages/admin/Users";
import Companies from "../pages/admin/Companies";
import Jobs from "../pages/admin/Jobs";
import LiveProctoring from "../pages/admin/LiveProctoring";
import ProctoringSummary from "../pages/admin/ProctoringSummary";
import PostJob from "../pages/company/PostJob";
import MyJobs from "../pages/company/MyJobs";
import Applicants from "../pages/company/Applicants";
import Landing from "../pages/public/Landing";
import UserDashboard from "../pages/user/UserDashboard";
import JobSearch from "../pages/user/JobSearch";
import JobDetails from "../pages/user/JobDetails";
import MyApplications from "../pages/user/MyApplications";
import SavedJobs from "../pages/user/SavedJobs";
import ApplyJob from "../pages/user/ApplyJob";
import UserProfile from "../pages/user/UserProfile";
import LegalLayout from "../layouts/LegalLayout";
import Terms from "../pages/public/Terms";
import Privacy from "../pages/public/Privacy";

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (user.role === "admin") return <Navigate to="/admin" />;
  if (user.role === "company") return <Navigate to="/company" />;
  return <Navigate to="/user" />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Landing />} />
        {/* Auto redirect after login */}
        <Route path="/redirect" element={<RoleRedirect />} />

        {/* <Route path='/legal' element ={<LegalLayout/>} > */}
          <Route path="legal/terms" element={<Terms />} />
          <Route path="legal/privacy" element={<Privacy />} />
        {/* </Route> */}

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* User */}
        <Route
          path="/user"
          element={
            <ProtectedRoute role="user">
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="jobs" element={<JobSearch />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="saved" element={<SavedJobs />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="apply/:id" element={<ApplyJob />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="companies" element={<Companies />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="proctoring" element={<LiveProctoring />} />
          <Route path="proctoring/summary/:id" element={<ProctoringSummary />} />
        </Route>

        {/* Company */}
        <Route
          path="/company"
          element={
            <ProtectedRoute role="company">
              <CompanyLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CompanyDashboard />} />
          <Route path="dashboard" element={<CompanyDashboard />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="jobs" element={<MyJobs />} />
          <Route path="applicants" element={<Applicants />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}