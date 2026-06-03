import "./globals.css";
import Header from "./components/Header";

export const metadata = {
  title: "Match Archive",
  description: "One data model, three safe source types.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
