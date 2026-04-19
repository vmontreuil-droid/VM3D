"use client";
import AppShell from '@/components/app-shell';
import PageBanner from '@/components/page-banner';
import { FileText } from 'lucide-react';

export default function OffertePage() {
  return (
    <AppShell isAdmin={false}>
      <div className="space-y-4">
        <PageBanner
          eyebrow="Dashboard"
          title="Offerte aanvragen"
          description="Vraag hier eenvoudig een offerte aan voor jouw project. Deze functionaliteit wordt binnenkort beschikbaar gemaakt."
        />
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-[var(--accent)] mb-6" />
          <h2 className="text-xl font-semibold mb-2 text-[var(--text-main)]">Offerte aanvragen</h2>
          <p className="text-[var(--text-soft)] mb-4 text-center max-w-md">
            Het aanvragen van offertes via het klantportaal is binnenkort beschikbaar. Neem tot die tijd contact op via <a href="mailto:info@mv3d.be" className="text-[var(--accent)] underline">info@mv3d.be</a>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
