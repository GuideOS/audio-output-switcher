# `sound@GuideOS.de` – GuideOS Fork

> **GuideOS-Fork** – Angepasst für [GuideOS](https://github.com/GuideOS), eine auf Debian basierende Distribution.

Dieses Repository enthält eine modifizierte Version des Cinnamon-System-Applets `sound@cinnamon.org`, umbenannt zu `sound@GuideOS.de` und um die Funktionalität des Audio-Ausgang-Umschalters erweitert.

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

2. Original-Applet sichern und ersetzen:

   ```bash
   sudo cp -r /usr/share/cinnamon/applets/sound@cinnamon.org \
              /usr/share/cinnamon/applets/sound@cinnamon.org.bak
   sudo rm -rf /usr/share/cinnamon/applets/sound@cinnamon.org
   ```

3. Den Fork systemweit einspielen:

   ```bash
   sudo cp -r .local/share/cinnamon/applets/sound@GuideOS.de \
              /usr/share/cinnamon/applets/
   ```

   > **Hinweis:** Das Applet läuft unter dem UUID `sound@GuideOS.de`. Es ersetzt das Original (`sound@cinnamon.org`) vollständig. Die Änderung gilt für alle Benutzer des Systems. Um zum Original zurückzukehren:
   >
   > ```bash
   > sudo rm -rf /usr/share/cinnamon/applets/sound@GuideOS.de
   > sudo mv /usr/share/cinnamon/applets/sound@cinnamon.org.bak \
   >         /usr/share/cinnamon/applets/sound@cinnamon.org
   > ```
   >
   > Anschließend in den Cinnamon-Einstellungen → Applets das alte `sound@cinnamon.org` wieder hinzufügen und `sound@GuideOS.de` entfernen.

4. Cinnamon neu starten (`Alt+F2` → `r` → Enter) oder abmelden und neu anmelden.

## Verwendung

Klick auf das Sound-Icon in der Taskleiste öffnet das Lautstärke-Menü. Dort befindet sich der Eintrag **„Audio Output"** mit allen verfügbaren Ausgängen. Der aktive Ausgang ist mit ✓ markiert. Ein Klick wechselt sofort und verschiebt alle laufenden Streams.

## Projektstruktur

```text
audio-output-switcher/
└── .local/share/cinnamon/applets/
    └── sound@GuideOS.de/      # wird nach /usr/share/cinnamon/applets/ kopiert
        ├── applet.js          # Sound-Applet mit integriertem Audio-Ausgang-Umschalter
        ├── metadata.json
        └── settings-schema.json
```

## Lizenz

GPL-2.0 License – © 2026 GuideOS. Siehe [LICENSE](LICENSE).
