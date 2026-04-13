import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <div>
      <Navbar />
      <div className="pt-24 px-6 max-w-7xl mx-auto">
        <Outlet />
      </div>
    </div>
  );
}