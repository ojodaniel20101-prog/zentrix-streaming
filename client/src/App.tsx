import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MoviesPage from "./pages/MoviesPage";
import TVPage from "./pages/TVPage";
import AnimePage from "./pages/AnimePage";
import SearchPage from "./pages/SearchPage";
import WatchPage from "./pages/WatchPage";
import DetailPage from "./pages/DetailPage";
import WatchlistPage from "./pages/WatchlistPage";
import AdminPanel from "./pages/AdminPanel";
import SportsPage from "./pages/SportsPage";
import SportsWatchPage from "./pages/SportsWatchPage";
import { WatchlistProvider } from "./contexts/WatchlistContext";
import BottomNav from "./components/BottomNav";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/movies" component={MoviesPage} />
      <Route path="/tv" component={TVPage} />
      <Route path="/anime" component={AnimePage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/watch/:type/:id" component={WatchPage} />
      <Route path="/detail/:type/:id" component={DetailPage} />
      <Route path="/watchlist" component={WatchlistPage} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/sports" component={SportsPage} />
      <Route path="/sports/live/:id" component={SportsWatchPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
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
            <Router />
            <BottomNav />
          </TooltipProvider>
        </WatchlistProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
