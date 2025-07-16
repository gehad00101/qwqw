import type { Metadata } from 'next';
import { Noto_Kufi_Arabic } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const notoKufiArabic = Noto_Kufi_Arabic({ 
  subsets: ['arabic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'تطبيق قائمة المهام',
  description: 'تطبيق بسيط وأنيق لإدارة مهامك اليومية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={notoKufiArabic.className}>
        <Toaster position="bottom-center" />
        {children}
      </body>
    </html>
  )
}
