import './globals.css'

export const metadata = {
  title: 'Portal do Franqueado PHIQ',
  description: 'Portal do Franqueado PHIQ — conhecimento, jornada, rede e suporte.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
