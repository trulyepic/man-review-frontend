import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SeriesDetailPage from "./pages/SeriesDetailPage";
import FilteredSeriesPage from "./pages/FilteredSeriesPage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/series/:id" element={<SeriesDetailPage />} />
        <Route path="/type/:seriesType" element={<FilteredSeriesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
