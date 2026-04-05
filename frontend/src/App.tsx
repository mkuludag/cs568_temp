/**
 * Root application component.
 */

import GovBanner from "./components/layout/GovBanner";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Breadcrumb from "./components/layout/Breadcrumb";
import Footer from "./components/layout/Footer";
import DashboardPage from "./components/dashboard/DashboardPage";
import { useState } from "react";
import type { Disease } from "./services/types";

export default function App() {
  // Lift minimal state for breadcrumb + sidebar awareness
  const [disease] = useState<Disease>("flu");
  const [jurisdiction] = useState("USA");
  const [agentsEnabled] = useState(false);

  return (
    <div className="app">
      <GovBanner />
      <Header />
      <Breadcrumb disease={disease} jurisdiction={jurisdiction} />

      <div className="app__body">
        <Sidebar agentsEnabled={agentsEnabled} />
        <main className="app__main">
          <DashboardPage />
        </main>
      </div>

      <Footer />
    </div>
  );
}
