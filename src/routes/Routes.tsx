import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import About from "../pages/About";
import Contact from "../pages/Contact";
import NotFound from "../pages/NotFound";
import Home from "../pages/Home";
// import AdminRoute from "./AdminRoutes";
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Services from "@/pages/Services";
import NewsFeed from "@/pages/NewsFeed";
import WorldProject from "@/pages/WorldProject";
import NewProject from "@/pages/NewProject";
import Portfolio from "@/pages/Portfolio";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import DashboardLayout from "@/Layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard/Dashboard";
import AdminLayout from "@/Layout/AdminLayout";
import NewProposal from "@/pages/Dashboard/NewProposal";
import { ProfileSettings } from "@/pages/ProfileSettings";
import Media from "@/pages/Dashboard/Media";
import Financials from "@/pages/Dashboard/Financials";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NewsFeedDetails from "@/pages/NewsFeedDetails";
import WorldProjectDetails from "@/pages/WorldProjectDetails";
import VerifyEmail from "@/pages/VerifyEmail";
import UserDashboard from "@/pages/UserDashboard";
import Employees from "@/pages/Dashboard/Employees";
import NewDynamicProposalPage from "@/pages/Dashboard/NewDynamicProposal";
import Proposals from "@/pages/Dashboard/Proposals";
import NewInquiryPage from "@/pages/Dashboard/NewInquiries";
import NewInquiriesListPage from "@/pages/Dashboard/NewInquiriesList";
// import ProfileSettings from "@/pages/ProfileSettings";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/newsFeed",
        element: <NewsFeed />,
      },
      {
        path: "/newsFeed/:id",
        element: <NewsFeedDetails />,
      },
      {
        path: "/world-project",
        element: <WorldProject />,
      },
      {
        path: "/world-project/:id",
        element: <WorldProjectDetails />,
      },
      {
        path: "/new-project",
        element: <NewProject />,
      },
      {
        path: "/portfolio",
        element: <Portfolio />,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/contact",
        element: <Contact />,
      },
      {
        path: "/services",
        element: <Services />,
      },
      // {
      //   path: "/form",
      //   element: <Form />,
      // },
      {
        path: "/terms",
        element: <Terms />,
      },
      {
        path: "/privacy",
        element: <Privacy />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
      {
        path: "/forgotPassword",
        element: <ForgotPassword />,
      },
      {
        path: "/resetPassword",
        element: <ResetPassword />,
      },
      {
        path: "/verify-email",
        element: <VerifyEmail />,
      },
      {
        path: "/profile-settings",
        element: <ProfileSettings />,
      },
      {
        path: "/user-dashboard",
        element: <UserDashboard />,
      },
      // {
      //   path: "/admin",
      //   element: <AdminRoute />, // This will check if the user is an admin
      //   children: [
      //     { path: "", element: <AdminDashboard /> }, // Admin Dashboard
      //   ],
      // },
    ],
  },
  {
    path: "/dashboard",
    // element: <AdminRoute />, // This will check if the user is an admin
    element: <DashboardLayout />,
    children: [
      { path: "", element: <Dashboard /> },
      { path: "new-proposal", element: <NewProposal /> },
      { path: "new-inquiries", element: <NewInquiryPage /> },
      { path: "new-inquiries-list", element: <NewInquiriesListPage /> },
      { path: "new-proposal/:id", element: <NewDynamicProposalPage /> },
      { path: "media", element: <Media /> },
      { path: "financials", element: <Financials /> },
      { path: "employees", element: <Employees /> },
      { path: "proposals", element: <Proposals /> },
    ],
  },
  {
    path: "/admin",
    // element: <AdminRoute />, // This will check if the user is an admin
    element: <AdminLayout />,
    children: [
      { path: "", element: <AdminDashboard /> }, // Admin Dashboard
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default routes;
