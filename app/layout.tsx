import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Room Reservation",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col bg-white text-neutral-900">
        <header>
          <NavBar />
        </header>
        <div className="flex-1 flex flex-col">{children}</div>
        <footer>
          <Footer />
        </footer>
      </body>
    </html>
  );
}
