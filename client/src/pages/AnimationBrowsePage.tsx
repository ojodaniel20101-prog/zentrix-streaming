import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrowsePage from "@/components/BrowsePage";

export default function AnimationBrowsePage() {
  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />
      <BrowsePage type="animation" title="🎨 Browse All Animations" />
      <Footer />
    </div>
  );
}
