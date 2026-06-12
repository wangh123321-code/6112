import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GamePage from "@/pages/GamePage";
import TacticEditorPage from "@/pages/TacticEditorPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GamePage />} />
        <Route path="/tactic-editor" element={<TacticEditorPage />} />
      </Routes>
    </Router>
  );
}
