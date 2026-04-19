"use client";
import { useState, useRef } from "react";
import AppShell from '@/components/app-shell';
import PageBanner from '@/components/page-banner';
import { FileText, CheckCircle2, UploadCloud } from 'lucide-react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function OffertePage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    description: "",
    file: undefined as File | undefined,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, files } = e.target as any;
    if (name === "file" && files && files[0]) {
      setForm((f) => ({ ...f, file: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200); // Simuleer verzending
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-4">
        <PageBanner
          eyebrow="Dashboard"
          title="Offerte aanvragen"
          description="Vraag eenvoudig een offerte aan voor jouw project. Vul het formulier in en wij nemen snel contact met je op."
        />
        <div className="flex flex-col items-center justify-center py-10">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 p-8 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <h2 className="text-xl font-semibold text-[var(--text-main)]">Offerte verzonden!</h2>
              <p className="text-[var(--text-soft)] text-center max-w-md">
                Bedankt voor je aanvraag. We nemen zo snel mogelijk contact met je op.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-lg space-y-6 p-8 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow"
            >
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="font-medium text-[var(--text-main)]">Naam</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Jouw naam"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-medium text-[var(--text-main)]">E-mail</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="jij@bedrijf.be"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="font-medium text-[var(--text-main)]">Projectomschrijving</label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={form.description}
                  onChange={handleChange}
                  className="input min-h-[100px]"
                  placeholder="Beschrijf kort je project of vraag."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="file" className="font-medium text-[var(--text-main)]">Bijlage (optioneel)</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card-2)] text-[var(--text-main)] hover:bg-[var(--bg-card)] transition"
                  >
                    <UploadCloud className="h-5 w-5" />
                    {form.file ? form.file.name : "Kies bestand"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    name="file"
                    className="hidden"
                    onChange={handleChange}
                  />
                  {form.file && (
                    <button
                      type="button"
                      className="ml-2 text-xs text-red-500 hover:underline"
                      onClick={() => setForm((f) => ({ ...f, file: undefined }))}
                    >Verwijder</button>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className={classNames(
                  "btn-primary w-full flex justify-center items-center gap-2",
                  loading ? "opacity-60 cursor-not-allowed" : ""
                )}
                disabled={loading}
              >
                <FileText className="h-5 w-5" />
                {loading ? "Verzenden..." : "Offerte aanvragen"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
