"use client";
import { useState, useRef } from "react";
import AppShell from '@/components/app-shell';
import PageBanner from '@/components/page-banner';
import { FileText, UploadCloud, Info, CheckCircle2 } from 'lucide-react';

const DIENSTEN = [
  "3D scanning",
  "3D modelleren",
  "BIM & Digital Twin",
  "Meetstaat & Calculatie",
  "As-built plannen",
  "Overig (specificeer in omschrijving)",
];

const INPUT_CLASS = "mt-2 w-full rounded-lg border border-[var(--border-soft)] bg-white dark:bg-[#202b38] px-4 py-3 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition";

export default function OffertePage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    vat: "",
    dienst: "",
    date: "",
    title: "",
    description: "",
    file: undefined as File | undefined,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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
    }, 800);
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-4">
        <PageBanner
          eyebrow="Offerteportaal"
          title="Offerte Aanvragen"
          description="Ontvang een offerte op maat voor uw 3D-project. Vul het formulier zorgvuldig in. Elk veld bevat uitleg en tips om u te begeleiden."
        />
        <div className="flex flex-col items-center justify-center py-10">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <h2 className="text-2xl font-bold text-[var(--text-main)]">Offerte verzonden!</h2>
              <p className="text-[var(--text-soft)]">
                Bedankt voor uw aanvraag. We nemen zo snel mogelijk contact met u op.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-3xl space-y-10 p-10 rounded-3xl border border-[var(--border-soft)] bg-white dark:bg-[linear-gradient(120deg,#1b2633_80%,#222f3d_100%)] shadow-2xl"
            >
              {/* Persoonlijke gegevens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="font-semibold text-[var(--text-main)]">Volledige naam *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="Jan Jansen"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="font-semibold text-[var(--text-main)]">E-mailadres *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="jan@voorbeeld.be"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-2 flex items-center gap-1"><Info className="inline h-3 w-3" /> We sturen de offerte naar dit adres.</p>
                </div>
                <div>
                  <label htmlFor="phone" className="font-semibold text-[var(--text-main)]">Telefoonnummer</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="+32 470 12 34 56"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-2 flex items-center gap-1"><Info className="inline h-3 w-3" /> Optioneel, handig voor snelle opvolging.</p>
                </div>
                <div>
                  <label htmlFor="vat" className="font-semibold text-[var(--text-main)]">BTW-nummer</label>
                  <input
                    type="text"
                    id="vat"
                    name="vat"
                    value={form.vat}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="BE 0123.456.789"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-2 flex items-center gap-1"><Info className="inline h-3 w-3" /> Optioneel, voor zakelijke klanten.</p>
                </div>
              </div>

              {/* Projectgegevens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dienst" className="font-semibold text-[var(--text-main)]">Gewenste dienst *</label>
                  <select
                    id="dienst"
                    name="dienst"
                    required
                    value={form.dienst}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                  >
                    <option value="">Selecteer een dienst...</option>
                    {DIENSTEN.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="date" className="font-semibold text-[var(--text-main)]">Gewenste uitvoeringsdatum</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-2 flex items-center gap-1"><Info className="inline h-3 w-3" /> Vroeger bestellen = voordeliger tarief.</p>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="title" className="font-semibold text-[var(--text-main)]">Titel / Onderwerp *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="Offerteaanvraag werf Antwerpen"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-2 flex items-center gap-1"><Info className="inline h-3 w-3" /> Geef een korte, duidelijke titel.</p>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="font-semibold text-[var(--text-main)]">Projectbeschrijving *</label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    value={form.description}
                    onChange={handleChange}
                    className={INPUT_CLASS + " min-h-[100px]"}
                    placeholder="Beschrijf uw project of aanvraag in meer detail..."
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-2 flex items-center gap-1"><Info className="inline h-3 w-3" /> Hoe meer info, hoe beter onze offerte aansluit.</p>
                </div>
              </div>

              {/* Bijlagen */}
              <div>
                <label htmlFor="file" className="font-semibold text-[var(--text-main)]">Bijlagen (optioneel)</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--accent)] rounded-xl bg-white dark:bg-[#202b38] py-8 px-4 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-card-2)] transition"
                  >
                    <UploadCloud className="h-5 w-5" />
                    {form.file ? form.file.name : "Klik om bestanden te selecteren"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    name="file"
                    className="hidden"
                    onChange={handleChange}
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-2">DXF, DWG, XML, PDF, ZIP — max 60MB per bestand</p>
                  {form.file && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-red-500 hover:underline"
                      onClick={() => setForm((f) => ({ ...f, file: undefined }))}
                    >
                      Verwijder bestand
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-10 py-3 text-base font-semibold rounded-lg bg-[var(--accent)] text-white shadow-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FileText className="h-5 w-5" />
                  {loading ? "Verzenden..." : "Aanvraag Versturen"}
                </button>
              </div>
              <p className="text-xs text-[var(--text-soft)]">* Verplichte velden</p>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
