import { Route, Routes } from "react-router-dom";
import AdminPasswordGate from "./components/AdminPasswordGate";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/admin"
        element={
          <AdminPasswordGate>
            <AdminPage />
          </AdminPasswordGate>
        }
      />
    </Routes>
  );
}
