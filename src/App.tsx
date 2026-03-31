import { Route, Routes } from "react-router-dom";
import MigrantPayApp from "./MigrantPayApp";

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<MigrantPayApp />} />
    </Routes>
  );
}
