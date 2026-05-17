# FOLIO — Dein digitales Portfolio Builder

Ein animiertes Portfolio-Generator-Tool für IT-Fachleute.  
Kein Framework, keine Abhängigkeiten — reines HTML/CSS/JS.

---

## Dateistruktur

```
folio-project/
├── index.html     # Builder-UI (Formular, Live-Vorschau, Schritte 1–7)
├── style.css      # Alle Stile für den Builder
├── main.js        # Gesamte App-Logik (State, KI-Extraktion, Portfolio-Export)
└── README.md
```

---

## Features

| Feature | Details |
|---|---|
| **7-Schritt-Builder** | Import → Identität → Skills → Projekte → Karriere → Kontakt → Design |
| **KI-Extraktion** | Lebenslauf/Anschreiben hochladen → Claude analysiert automatisch |
| **8 Animationsstile** | Scroll-Reveal, Terminal, Glitch, Fade, Bounce-In, Zoom-Reveal, Slide-In, Neon-Wave |
| **5 Hero-Eingänge** | Standard, Split-Lines, Typewriter, Blur-to-Focus, Buchstaben-Scramble |
| **6 Themes** | Noir, Solaire, Cyber, Monolith, Aurora, Slate |
| **Animationsgeschwindigkeit** | Langsam / Normal / Schnell |
| **Stagger-Effekt** | Zeitversetzter Eingang der Elemente (Toggle) |
| **Abschnitts-Trennlinie** | Linie / Gradient / Punkte / Kein |
| **Dark & Light Mode** | Umschaltbar im Builder und im Export |
| **JSON Import/Export** | Daten speichern und wiederverwenden |
| **Standalone HTML-Export** | Fertige Portfolio-Datei ohne Internet-Abhängigkeit |

---

## Lokal starten

```bash
# Einfach index.html im Browser öffnen — kein Server nötig
open index.html

# Oder mit einem lokalen Dev-Server (empfohlen für API-Calls):
npx serve .
# → http://localhost:3000
```

> **Hinweis:** Die KI-Extraktion (Claude API) benötigt eine Internetverbindung.  
> Das generierte Portfolio funktioniert vollständig offline.

---

## Anthropic API

Die App ruft `https://api.anthropic.com/v1/messages` direkt aus dem Browser auf.  
Das funktioniert nur, wenn kein API-Key-Check aktiv ist (z. B. in der claude.ai-Umgebung).  
Für den eigenen Einsatz: API-Aufruf in eine Backend-Route auslagern.

---

## Bekannte Einschränkungen

- `buildPortfolio()` in `main.js` gibt einen langen HTML-String zurück — gut für Debugging via `Strg+F`
- Der `srcdoc`-Iframe für die Live-Vorschau hat in manchen Browsern ein Rendering-Delay
- Scramble- und Typewriter-Hero-Animationen funktionieren nur im exportierten Portfolio, nicht in der Vorschau

---

## Lizenz

MIT — frei verwendbar und modifizierbar.
