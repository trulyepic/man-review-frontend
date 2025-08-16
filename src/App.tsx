import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SeriesDetailPage from "./pages/SeriesDetailPage";
import FilteredSeriesPage from "./pages/FilteredSeriesPage";
import { SearchProvider } from "./components/SearchContext";
import Footer from "./components/Footer";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import CheckYourEmailPage from "./pages/CheckYourEmailPage";
import RankingsInfoPage from "./pages/RankingsInfoPage";
import ComparePage from "./pages/ComparePage";
import MyReadingListsPage from "./pages/MyReadingListsPage";
import ReportIssuePage from "./pages/ReportIssuePage";
import IssuesPage from "./pages/IssuesPage";

function App() {
  return (
    <SearchProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/series/:id" element={<SeriesDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route
                path="/check-your-email"
                element={<CheckYourEmailPage />}
              />
              <Route
                path="/type/:seriesType"
                element={<FilteredSeriesPage />}
              />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-rankings-work" element={<RankingsInfoPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/my-lists" element={<MyReadingListsPage />} />
              <Route path="/issues" element={<IssuesPage />} />
              <Route path="/report-issue" element={<ReportIssuePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </SearchProvider>
  );
}

export default App;
