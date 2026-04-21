# Geo-setup file library

Plaats hier de officiële geoide- en CRS-bestanden per regio en vendor.

## Structuur

```
public/geo/
  be/
    topcon/      → lambert2008.gc3, hbg18.ggf
    leica/       → lambert2008.csv, hbg18.gem
    unicontrol/  → be-lambert2008-hbg18.json
  nl/
    topcon/      → rdnew.gc3, nlgeo2018.ggf
    leica/       → rdnew.csv, nlgeo2018.gem
    unicontrol/  → nl-rdnew-nlgeo2018.json
  fr/
    topcon/      → lambert93.gc3, raf20.ggf
    leica/       → lambert93.csv, raf20.gem
    unicontrol/  → fr-lambert93-raf20.json
  lu/
    topcon/      → luref.gc3, luref-grid.ggf
    leica/       → luref.csv, luref-grid.gem
    unicontrol/  → lu-luref-grid.json
```

## Activeren in de UI

Na het uploaden van een bestand: zet `available: true` op de bijbehorende
entry in `src/app/admin/tools/geo-setup/manifest.ts`. De download-knop wordt
dan groen en functioneel; tot dan toont de UI "Nog niet beschikbaar".

## Bronbestanden (officiële downloadlinks)

- **België — hBG18 + Lambert 2008**: NGI (ngi.be)
- **Nederland — NLGEO2018 + RD New**: Het Kadaster / NSGI
- **Frankrijk — RAF20 + Lambert-93**: IGN (ign.fr / geodesie.ign.fr)
- **Luxembourg — LUREF**: ACT (act.public.lu)

Vendor-specifieke conversies (.gc3 / .gem / .ggf) maak je via de officiële
tools van Topcon (3D Office), Leica (Infinity / iCON Office) of via de
Unicontrol cloud-tools.
