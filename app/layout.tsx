import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Calendrier de Déborah",
  description: 'Un calendrier fait avec ❤️ par Ramzi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // LA MODIFICATION EST ICI
    <html lang="fr" suppressHydrationWarning={true}>
      {/* "suppressHydrationWarning={true}" 
        C'est la commande qui dit à React : 
        "Je m'en fiche du conflit (bis_register), AFFICHE LE DESIGN."
      */}
      <body>
        {children}
      </body>
    </html>
  )
}