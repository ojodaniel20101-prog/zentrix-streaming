import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrowsePage from "@/components/BrowsePage";

export default function MoviesBrowsePage() {
  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />
      <BrowsePage type="movie" title="🎬 Browse All Movies" />
      <Footer />
    </div>
  );
}
