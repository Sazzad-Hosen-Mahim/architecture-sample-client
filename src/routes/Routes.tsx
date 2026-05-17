import { createBrowserRouter } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import App from "../App";
import { Loader2 } from "lucide-react";

// Lazy load page components
const Home = lazy(() => import("../pages/Home"));
const About = lazy(() => import("../pages/About"));
const Contact = lazy(() => import("../pages/Contact"));
const NotFound = lazy(() => import("../pages/NotFound"));
const AdminDashboard = lazy(() => import("@/pages/Admin/AdminDashboard"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Services = lazy(() => import("@/pages/Services"));
const NewsFeed = lazy(() => import("@/pages/NewsFeed"));
const WorldProject = lazy(() => import("@/pages/WorldProject"));
const NewProject = lazy(() => import("@/pages/NewProject"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const DashboardLayout = lazy(() => import("@/Layout/DashboardLayout"));
const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard"));
const AdminLayout = lazy(() => import("@/Layout/AdminLayout"));
const NewProposal = lazy(() => import("@/pages/Dashboard/NewProposal"));
const ProfileSettings = lazy(() => import("@/pages/ProfileSettings").then(module => ({ default: module.ProfileSettings })));
const Media = lazy(() => import("@/pages/Dashboard/Media"));
const Financials = lazy(() => import("@/pages/Dashboard/Financials"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NewsFeedDetails = lazy(() => import("@/pages/NewsFeedDetails"));
const WorldProjectDetails = lazy(() => import("@/pages/WorldProjectDetails"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const UserDashboard = lazy(() => import("@/pages/UserDashboard"));
const Employees = lazy(() => import("@/pages/Dashboard/Employees"));
const NewDynamicProposalPage = lazy(() => import("@/pages/Dashboard/NewDynamicProposal"));
const Proposals = lazy(() => import("@/pages/Dashboard/Proposals"));
const NewInquiryPage = lazy(() => import("@/pages/Dashboard/NewInquiries"));
const NewInquiriesListPage = lazy(() => import("@/pages/Dashboard/NewInquiriesList"));
const TimecardsPage = lazy(() => import("@/pages/Dashboard/TimecardsPage"));
const Teams = lazy(() => import("@/pages/Dashboard/Teams"));
const RefundRequests = lazy(() => import("@/pages/Dashboard/RefundRequests"));
const ClientUsers = lazy(() => import("@/pages/Dashboard/ClientUsers"));

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

const routes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <SuspenseWrapper><Home /></SuspenseWrapper>,
      },
      {
        path: "/newsFeed",
        element: <SuspenseWrapper><NewsFeed /></SuspenseWrapper>,
      },
      {
        path: "/newsFeed/:id",
        element: <SuspenseWrapper><NewsFeedDetails /></SuspenseWrapper>,
      },
      {
        path: "/world-project",
        element: <SuspenseWrapper><WorldProject /></SuspenseWrapper>,
      },
      {
        path: "/world-project/:id",
        element: <SuspenseWrapper><WorldProjectDetails /></SuspenseWrapper>,
      },
      {
        path: "/new-project",
        element: <SuspenseWrapper><NewProject /></SuspenseWrapper>,
      },
      {
        path: "/portfolio",
        element: <SuspenseWrapper><Portfolio /></SuspenseWrapper>,
      },
      {
        path: "/about",
        element: <SuspenseWrapper><About /></SuspenseWrapper>,
      },
      {
        path: "/contact",
        element: <SuspenseWrapper><Contact /></SuspenseWrapper>,
      },
      {
        path: "/services",
        element: <SuspenseWrapper><Services /></SuspenseWrapper>,
      },
      {
        path: "/terms",
        element: <SuspenseWrapper><Terms /></SuspenseWrapper>,
      },
      {
        path: "/privacy",
        element: <SuspenseWrapper><Privacy /></SuspenseWrapper>,
      },
      {
        path: "/login",
        element: <SuspenseWrapper><Login /></SuspenseWrapper>,
      },
      {
        path: "/signup",
        element: <SuspenseWrapper><Signup /></SuspenseWrapper>,
      },
      {
        path: "/forgotPassword",
        element: <SuspenseWrapper><ForgotPassword /></SuspenseWrapper>,
      },
      {
        path: "/resetPassword",
        element: <SuspenseWrapper><ResetPassword /></SuspenseWrapper>,
      },
      {
        path: "/verify-email",
        element: <SuspenseWrapper><VerifyEmail /></SuspenseWrapper>,
      },
      {
        path: "/profile-settings",
        element: <SuspenseWrapper><ProfileSettings /></SuspenseWrapper>,
      },
      {
        path: "/user-dashboard",
        element: <SuspenseWrapper><UserDashboard /></SuspenseWrapper>,
      },
    ],
  },
  {
    path: "/dashboard",
    element: <SuspenseWrapper><DashboardLayout /></SuspenseWrapper>,
    children: [
      { path: "", element: <SuspenseWrapper><Dashboard /></SuspenseWrapper> },
      { path: "new-proposal", element: <SuspenseWrapper><NewProposal /></SuspenseWrapper> },
      { path: "new-inquiries", element: <SuspenseWrapper><NewInquiryPage /></SuspenseWrapper> },
      { path: "new-inquiries-list", element: <SuspenseWrapper><NewInquiriesListPage /></SuspenseWrapper> },
      { path: "new-proposal/:id", element: <SuspenseWrapper><NewDynamicProposalPage /></SuspenseWrapper> },
      { path: "media", element: <SuspenseWrapper><Media /></SuspenseWrapper> },
      { path: "financials", element: <SuspenseWrapper><Financials /></SuspenseWrapper> },
      { path: "employees", element: <SuspenseWrapper><Employees /></SuspenseWrapper> },
      { path: "proposals", element: <SuspenseWrapper><Proposals /></SuspenseWrapper> },
      { path: "timecards", element: <SuspenseWrapper><TimecardsPage /></SuspenseWrapper> },
      { path: "teams", element: <SuspenseWrapper><Teams /></SuspenseWrapper> },
      { path: "refund-requests", element: <SuspenseWrapper><RefundRequests /></SuspenseWrapper> },
      { path: "client-users", element: <SuspenseWrapper><ClientUsers /></SuspenseWrapper> },
    ],
  },
  {
    path: "/admin",
    element: <SuspenseWrapper><AdminLayout /></SuspenseWrapper>,
    children: [
      { path: "", element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper> },
    ],
  },
  {
    path: "*",
    element: <SuspenseWrapper><NotFound /></SuspenseWrapper>,
  },
]);

export default routes;
