import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({
  variable: '--font-geist-ticket',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Project /N/ — 평가원 수학 아카이브',
  description: '평가원 수학 시험지와 문항을 연도, 월, 선택과목, 번호별로 찾아보세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
