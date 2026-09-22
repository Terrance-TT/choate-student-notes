import { Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Digest from "@/pages/Digest";
import Departments from "@/pages/Departments";
import Submit from "@/pages/Submit";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import Admin from "@/pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="digest" element={<Digest />} />
        <Route path="departments" element={<Departments />} />
        <Route path="submit" element={<Submit />} />
        <Route path="settings" element={<Settings />} />
        <Route path="about" element={<About />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
