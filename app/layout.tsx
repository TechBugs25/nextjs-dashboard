import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import React from "react";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Acme Dashboard',
        default: 'Acme Dashboard',
    },
    description: 'The official Next.js Learn Dashboard built with App Router.',
    metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
    keywords: ['Dashboard', 'Next.js', 'React', 'Invoices', 'Customers'],
    authors: [{ name: 'Acme Corp' }],
    openGraph: {
        title: 'Acme Dashboard',
        description: 'The official Next.js Learn Dashboard built with App Router.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} antialiased`}>{children}</body>
        </html>
    );
}
