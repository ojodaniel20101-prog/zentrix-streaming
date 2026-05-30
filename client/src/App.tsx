/* ZENTRIX_TECH — App Router
   Design: Obsidian Forge — Tactical Dark UI meets Cinematic Brutalism
   Routes: Home, Movies, TV Shows, Anime, Search, Watch, Detail, Profile, Admin, Channels
*/
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import MoviesPage from "./pages/MoviesPage";
import TVPage from "./pages/TVPage";
import AnimePage from "./pages/AnimePage";
import SearchPage from "./pages/SearchPage";
import WatchPage from "./pages/WatchPage";
import DetailPage from "./pages/DetailPage";
import WatchlistPage from "./pages/WatchlistPage";
import AdminPanel from "./pages/AdminPanel";
import ProfilePage from "./pages/ProfilePage";
import UserDashboard from "./pages/UserDashboard";
import AnimatedMovies from "./pages/AnimatedMovies";
import AnimatedMoviesPage from "./pages/AnimatedMoviesPage";
import MoviesBrowsePage from "./pages/MoviesBrowsePage";
import TVBrowsePage from "./pages/TVBrowsePage";
import AnimeBrowsePage from "./pages/AnimeBrowsePage";
import AnimationBrowsePage from "./pages/AnimationBrowsePage";
import FeedbackPage from "./pages/FeedbackPage";
import SportsPage from "./pages/SportsPage";
import SportsBrowsePage from "./pages/SportsBrowsePage";
import SportsWatchPage from "./pages/SportsWatchPage";
import WrestlingPage from "./pages/WrestlingPage";
import { WatchlistProvider } from "./contexts/WatchlistContext";
import { useTVNavigation } from "./hooks/useTVNavigation";
import { useLocation } from "wouter";
import InstallPrompt from "./components/InstallPrompt";

function RouterWithTV() {
  const [, navigate] = useLocation();
  useTVNavigation({
    onHome: () => navigate("/"),
  });
  return <Router />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/movies" component={MoviesPage} />
      <Route path="/movies/browse" component={MoviesBrowsePage} />
      <Route path="/tv" component={TVPage} />
      <Route path="/tv/browse" component={TVBrowsePage} />
      <Route path="/anime" component={AnimePage} />
      <Route path="/anime/browse" component={AnimeBrowsePage} />
      <Route path="/animated-movies" component={AnimatedMoviesPage} />
      <Route path="/animation/browse" component={AnimationBrowsePage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/watch/:type/:id" component={WatchPage} />
      <Route path="/detail/:type/:id" component={DetailPage} />
      <Route path="/watchlist" component={WatchlistPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/sports" component={SportsPage} />
      <Route path="/sports/browse" component={SportsBrowsePage} />
      <Route path="/sports/watch/:id" component={SportsWatchPage} />
      <Route path="/wrestling" component={WrestlingPage} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <WatchlistProvider>
            <TooltipProvider>
              <Toaster
                theme="dark"
                toastOptions={{
                  style: {
                    background: "rgba(11, 18, 32, 0.95)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    color: "#F0F4FF",
                    backdropFilter: "blur(12px)",
                  },
                }}
              />
              <RouterWithTV />
              <InstallPrompt />
            </TooltipProvider>
          </WatchlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
