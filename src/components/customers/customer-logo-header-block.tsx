"use client"
import CustomerLogoUploadInline from "./customer-logo-upload-inline"

export default function CustomerLogoHeaderBlock({ logoUrl }: { logoUrl?: string }) {
  return <CustomerLogoUploadInline logoUrl={logoUrl} />
}
