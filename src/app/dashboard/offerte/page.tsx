"use client";
import { useState, useRef } from "react";
import AppShell from '@/components/app-shell';
import PageBanner from '@/components/page-banner';
import { FileText, CheckCircle2, UploadCloud, Info } from 'lucide-react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const DIENSTEN = [
  "3D scanning",
  "3D modelleren",
  "BIM & Digital Twin",
  "Meetstaat & Calculatie",
  "As-built plannen",
  "Overig (specificeer in omschrijving)",
];

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
    }, 1200); // Simuleer verzending
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
            <div className="flex flex-col items-center gap-4 p-8 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <h2 className="text-xl font-semibold text-[var(--text-main)]">Offerte verzonden!</h2>
              <p className="text-[var(--text-soft)] text-center max-w-md">
                Bedankt voor uw aanvraag. We nemen zo snel mogelijk contact met u op.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-2xl space-y-8 p-8 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-lg"
            >
              {/* Persoonlijke gegevens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="font-medium text-[var(--text-main)]">Volledige naam *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="input mt-1"
                    placeholder="Jan Jansen"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-1"><Info className="inline h-3 w-3" /> Vul uw volledige naam in.</p>
                </div>
                <div>
                  <label htmlFor="email" className="font-medium text-[var(--text-main)]">E-mailadres *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="input mt-1"
                    placeholder="jan@voorbeeld.be"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-1"><Info className="inline h-3 w-3" /> We sturen de offerte naar dit adres.</p>
                </div>
                <div>
                  <label htmlFor="phone" className="font-medium text-[var(--text-main)]">Telefoonnummer</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="input mt-1"
                    placeholder="+32 470 12 34 56"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-1"><Info className="inline h-3 w-3" /> Optioneel, handig voor snelle opvolging.</p>
                </div>
                <div>
                  <label htmlFor="vat" className="font-medium text-[var(--text-main)]">BTW-nummer</label>
                  <input
                    type="text"
                    id="vat"
                    name="vat"
                    value={form.vat}
                    onChange={handleChange}
                    className="input mt-1"
                    placeholder="BE 0123.456.789"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-1"><Info className="inline h-3 w-3" /> Optioneel, voor zakelijke klanten.</p>
                </div>
              </div>

              {/* Projectgegevens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dienst" className="font-medium text-[var(--text-main)]">Gewenste dienst *</label>
                  <select
                    id="dienst"
                    name="dienst"
                    required
                    value={form.dienst}
                    onChange={handleChange}
                    className="input mt-1"
                  >
                    <option value="">Selecteer een dienst...</option>
                    {DIENSTEN.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-1"><Info className="inline h-3 w-3" /> Kies de dienst die het beste past.</p>
                </div>
                <div>
                  <label htmlFor="date" className="font-medium text-[var(--text-main)]">Gewenste uitvoeringsdatum</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="input mt-1"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-1"><Info className="inline h-3 w-3" /> Vroeger bestellen = voordeliger tarief.</p>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="title" className="font-medium text-[var(--text-main)]">Titel / Onderwerp *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleChange}
                    className="input mt-1"
                    placeholder="Offerteaanvraag werf Antwerpen"
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-1"><Info className="inline h-3 w-3" /> Geef een korte, duidelijke titel.</p>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="font-medium text-[var(--text-main)]">Projectbeschrijving *</label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    value={form.description}
                    onChange={handleChange}
                    className="input mt-1 min-h-[100px]"
                    placeholder="Beschrijf uw project of aanvraag in meer detail..."
                  />
                  <p className="text-xs text-[var(--text-soft)] mt-1 flex items-center gap-1"><Info className="inline h-3 w-3" /> Hoe meer info, hoe beter onze offerte aansluit.</p>
                </div>
              </div>

              {/* Bijlagen */}
              <div className="mt-6">
                <label htmlFor="file" className="font-medium text-[var(--text-main)]">Bijlagen (optioneel)</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--accent)] rounded-xl bg-[var(--bg-card-2)] py-6 px-4 mt-2">
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
                    >Verwijder bestand</button>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  className={classNames(
                    "btn-primary flex justify-center items-center gap-2 px-8 py-3 text-base font-semibold",
                    loading ? "opacity-60 cursor-not-allowed" : ""
                  )}
                  disabled={loading}
                >
                  <FileText className="h-5 w-5" />
                  {loading ? "Verzenden..." : "Aanvraag Versturen"}
                </button>
              </div>
              <p className="text-xs text-[var(--text-soft)] mt-4">* Verplichte velden</p>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
