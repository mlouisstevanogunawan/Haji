import {
  TopBar,
  Navbar,
  HeroSection,
  PackagesSection,
  FeaturesSection,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-800">
      {/* 1. Announcement Top Bar */}
      <TopBar />

      {/* 2. Sticky Navigation Header */}
      <Navbar />

      {/* Main Landing Sections */}
      <main className="flex-1">
        {/* 3. Hero Section with Dot Grid Pattern */}
        <HeroSection />

        {/* 4. Packages Catalog Section */}
        <PackagesSection />

        {/* 5. Four Key Service Features */}
        <FeaturesSection />
      </main>

      {/* 6. Dark Navy Footer */}
      <Footer />
    </div>
  );
}
