# `sound@cinnamon.org` – GuideOS Fork

> **GuideOS-Fork** – Angepasst für [GuideOS](https://github.com/GuideOS), eine auf Debian basierende Distribution.

Dieses Repository enthält eine modifizierte Version des Cinnamon-System-Applets `sound@cinnamon.org`, in die die Funktionalität des Audio-Ausgang-Umschalters direkt integriert wurde.

Das bekannte Sound-Applet erhält dadurch ohne separate Installation einen zusätzlichen Untermenüpunkt **„Audio Output"** zum Umschalten zwischen allen verfügbaren Ausgabegeräten – aktive Audio-Streams werden dabei automatisch mitbewegt.

---

## Features

- Untermenü **„Audio Output"** direkt im vorhandenen Lautstärke-Applet
- Unterstützte Gerätetypen: Bluetooth, HDMI/DisplayPort, S/PDIF, USB-Audio, Line-out, Kopfhörer, Lautsprecher
- Kompatibel mit **PipeWire** (pipewire-pulse) und **PulseAudio**
- Verschiebt alle laufenden Audio-Streams automatisch beim Umschalten
- Untermenü-Label zeigt immer den aktuell aktiven Ausgang an
- Aktualisiert die Geräteliste alle 4 Sekunden (erkennt z. B. neu verbundene Bluetooth-Geräte)
- Filtert Monitor-Sinks automatisch aus

## Voraussetzungen

- **Cinnamon** Desktop-Umgebung
- **PulseAudio** oder **PipeWire** mit `pactl`

## Installation

1. Repository klonen:

   ```bash
   git clone https://github.com/GuideOS/audio-output-switcher.git
   cd audio-output-switcher
   ```

   > Der `main`-Branch enthält immer den aktuellen stabilen Stand.

2. Das modifizierte Applet in den Cinnamon-Applet-Pfad kopieren:

   ```bash
   mkdir -p ~/.local/share/cinnamon/applets/
   cp -r .local/share/cinnamon/applets/sound@cinnamon.org \
         ~/.local/share/cinnamon/applets/
   ```

   > **Achtung:** Ein bereits vorhandenes Original-Applet `sound@cinnamon.org` wird dabei überschrieben. Vorher ggf. sichern:
   >
   > ```bash
   > cp -r ~/.local/share/cinnamon/applets/sound@cinnamon.org \
   >       ~/.local/share/cinnamon/applets/sound@cinnamon.org.bak
   > ```

3. Cinnamon neu starten (`Alt+F2` → `r` → Enter) oder abmelden und neu anmelden.

## Verwendung

Klick auf das Sound-Icon in der Taskleiste öffnet das Lautstärke-Menü. Dort befindet sich der Eintrag **„Audio Output"** mit allen verfügbaren Ausgängen. Der aktive Ausgang ist mit ✓ markiert. Ein Klick wechselt sofort und verschiebt alle laufenden Streams.

## Projektstruktur

```text
audio-output-switcher/
└── .local/share/cinnamon/applets/
    └── sound@cinnamon.org/
        ├── applet.js          # Sound-Applet mit integriertem Audio-Ausgang-Umschalter
        ├── metadata.json
        └── settings-schema.json
```

## Lizenz

MIT License – © 2026 GuideOS. Siehe [LICENSE](LICENSE).
