
import "./globals.css";
import Navbar from "../components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Navbar />
        <div className="p-4">{children}</div>
      </body>
    </html>
  );
}
