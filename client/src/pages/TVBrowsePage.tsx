import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrowsePage from "@/components/BrowsePage";

export default function TVBrowsePage() {
  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />
      <BrowsePage type="tv" title="📺 Browse All TV Shows" />
      <Footer />
    </div>
  );
}
