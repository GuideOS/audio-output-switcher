# audio-output-switcher

> Entwickelt für [GuideOS](https://github.com/GuideOS) – eine auf Debian basierende Distribution.

Ein Cinnamon-Panel-Applet, das verfügbare Audio-Ausgänge als Icon in der Taskleiste anzeigt. Per Klick öffnet sich ein Menü zum Umschalten zwischen allen erkannten Ausgabegeräten – aktive Audio-Streams werden dabei automatisch mitbewegt.

---

## Features

- Zeigt das aktive Ausgabegerät als kontextgerechtes Symbol in der Taskleiste
- Unterstützte Gerätetypen: Bluetooth, HDMI/DisplayPort, S/PDIF, USB-Audio, Line-out, Kopfhörer, Lautsprecher
- Kompatibel mit **PipeWire** (pipewire-pulse) und **PulseAudio**
- Verschiebt alle laufenden Audio-Streams automatisch beim Umschalten
- Aktualisiert Icon und Geräteliste alle 4 Sekunden (erkennt z. B. neu verbundene Bluetooth-Geräte)
- Filtert Monitor-Sinks (interne PulseAudio/PipeWire-Konstrukte) automatisch aus
- Deutschsprachige Gerätebeschriftungen

## Voraussetzungen

- **Cinnamon** Desktop-Umgebung
- **PulseAudio** oder **PipeWire** mit `pactl`

## Installation

1. Repository klonen oder als ZIP herunterladen:

   ```bash
   git clone https://github.com/GuideOS/audio-output-switcher.git
   ```

2. Applet-Verzeichnis in den Cinnamon-Applet-Pfad kopieren:

   ```bash
   cp -r .local/share/cinnamon/applets/audio-output-switcher@ktt73 \
         ~/.local/share/cinnamon/applets/
   ```

3. Cinnamon neu starten (z. B. `Alt+F2` → `r` → Enter) oder abmelden und neu anmelden.

4. Im Cinnamon-Einstellungsmenü unter **Applets** das Applet „Audio-Ausgang Umschalter" aktivieren und zur Taskleiste hinzufügen.

## Verwendung

Klick auf das Lautsprecher-/Kopfhörer-Icon in der Taskleiste öffnet ein Menü mit allen verfügbaren Audio-Ausgängen. Der aktive Ausgang ist markiert. Klick auf einen anderen Eintrag schaltet sofort um.

## Projektstruktur

```
audio-output-switcher/
└── .local/share/cinnamon/applets/
    └── audio-output-switcher@ktt73/
        ├── applet.js       # Applet-Logik (JavaScript)
        └── metadata.json   # Metadaten für Cinnamon
```

## Lizenz

MIT License – © 2026 GuideOS. Siehe [LICENSE](LICENSE).
