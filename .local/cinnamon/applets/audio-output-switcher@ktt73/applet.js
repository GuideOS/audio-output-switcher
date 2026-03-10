// Audio-Ausgang Umschalter – Cinnamon Applet
// Unterstützt: Bluetooth (bluez), HDMI/DisplayPort, S/PDIF, USB-Audio,
//             Line-out, Kopfhörer (analog)
// Läuft auf Debian Trixie mit PipeWire (pipewire-pulse) und PulseAudio.
// Funktioniert auf Desktop und Laptop mit eingebauter und angeschlossener Hardware.
// Verschiebt aktive Streams automatisch beim Umschalten.

const Applet      = imports.ui.applet;
const PopupMenu   = imports.ui.popupMenu;
const GLib        = imports.gi.GLib;
const St          = imports.gi.St;
const Lang        = imports.lang;
const Mainloop    = imports.mainloop;

const UUID = "audio-output-switcher@ktt73";

// ---------------------------------------------------------------------------
// Hilfsfunktion: Shell-Befehl synchron ausführen, Ausgabe als String
// ---------------------------------------------------------------------------
function spawnSync(cmd) {
    try {
        let [ok, out, , exit] = GLib.spawn_command_line_sync(cmd);
        if (!ok || exit !== 0) return null;
        // GJS gibt je nach Version Uint8Array oder String zurück
        if (out instanceof Uint8Array) {
            return new TextDecoder().decode(out).trim();
        }
        return out.toString().trim();
    } catch (e) {
        global.logError(UUID + ": spawnSync(" + cmd + ") – " + e);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Applet-Konstruktor
// ---------------------------------------------------------------------------
function AudioOutputSwitcher(metadata, orientation, panel_height, instance_id) {
    this._init(metadata, orientation, panel_height, instance_id);
}

AudioOutputSwitcher.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function (metadata, orientation, panel_height, instance_id) {
        Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        this.set_applet_icon_symbolic_name("audio-card");
        this.set_applet_tooltip("Audio-Ausgang wechseln");

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        // Anfangszustand setzen
        this._refreshIcon();

        // Alle 4 Sekunden auf neue/verschwundene Sinks prüfen (z.B. Bluetooth)
        this._timeout = Mainloop.timeout_add_seconds(4, Lang.bind(this, function () {
            this._refreshIcon();
            return GLib.SOURCE_CONTINUE;
        }));
    },

    // -----------------------------------------------------------------------
    // pactl list sinks parsen → Array von Sink-Objekten
    // -----------------------------------------------------------------------
    _parseSinks: function () {
        let output = spawnSync("pactl list sinks");
        if (!output) return [];

        let sinks   = [];
        let current = null;
        let inPorts = false;

        for (let line of output.split("\n")) {
            let m;

            // ── Neuer Sink ──────────────────────────────────────────────────
            if ((m = line.match(/^Sink #(\d+)/))) {
                if (current) sinks.push(current);
                current  = { id: m[1], name: "", desc: "", activePort: "", ports: [] };
                inPorts  = false;
                continue;
            }

            if (!current) continue;

            // ── Port-Einträge (mind. 2 Tabs/Leerzeichen) ───────────────────
            if (inPorts && line.match(/^[\t ]{2,}\S/)) {
                // Format: "\t\tport-name: Label (priority: X, available: yes|no|unknown)"
                if ((m = line.match(/^[\t ]+(\S+):\s+([^(]+)(?:\(.*available:\s*(\w+))?/))) {
                    let avail = m[3] ? m[3] : "unknown";
                    if (avail !== "no") {
                        current.ports.push({ name: m[1].trim(), label: m[2].trim() });
                    }
                }
                continue;
            }

            // ── Top-Level-Felder (genau 1 Tab/Leerzeichen) ─────────────────
            if (line.match(/^[\t ]\S/)) {
                inPorts = false;
                if ((m = line.match(/^[\t ]+Name:\s+(.+)/)))         current.name        = m[1].trim();
                else if ((m = line.match(/^[\t ]+Description:\s+(.+)/))) current.desc    = m[1].trim();
                else if ((m = line.match(/^[\t ]+Active Port:\s+(.+)/))) current.activePort = m[1].trim();
                else if (line.match(/^[\t ]+Ports:/))                  inPorts            = true;
            }
        }

        if (current) sinks.push(current);

        // PipeWire/PulseAudio legt für jeden Sink automatisch einen
        // "Monitor"-Sink an (für Loopback/Aufnahme). Diese werden hier
        // herausgefiltert, da sie keine Ausgabegeräte sind.
        return sinks.filter(function (s) {
            return !s.name.endsWith(".monitor") && !s.name.includes(".monitor.");
        });
    },

    // -----------------------------------------------------------------------
    // Aktuellen Standard-Sink ermitteln
    // -----------------------------------------------------------------------
    _getDefaultSink: function () {
        return spawnSync("pactl get-default-sink") || "";
    },

    // -----------------------------------------------------------------------
    // Sink-Typ aus dem Namen ableiten
    // PipeWire-Sink-Namen: alsa_output.pci-…hdmi-stereo, bluez_output.…, alsa_output.usb-…
    // -----------------------------------------------------------------------
    _sinkType: function (sinkName) {
        let n = sinkName.toLowerCase();
        if (n.includes("bluez"))            return "bluetooth";
        if (n.includes("usb"))              return "usb";
        if (n.includes("hdmi") || n.includes("iec958")) return "hdmi";
        return "analog";
    },

    // -----------------------------------------------------------------------
    // Port-Typ aus dem Port-Namen ableiten
    // Unterstützt klassische PulseAudio-Namen (analog-output-speaker, hdmi-output-0)
    // und PipeWire-Stil ([Out] Speaker, [Out] HDMI / DisplayPort 2).
    // -----------------------------------------------------------------------
    _portType: function (portName) {
        // PipeWire stellt Portnamen manchmal als "[Out] Label" dar
        let p = portName.toLowerCase().replace(/^\[out\]\s*/, "");
        if (p.includes("headphone") || p.includes("headset")) return "headphone";
        if (p.includes("hdmi") || p.includes("displayport") || p.includes("display port") ||
            p.includes("digital-output-hdmi") || p.startsWith("hdmi-output")) return "hdmi";
        if (p.includes("spdif") || p.includes("s/pdif") ||
            p.includes("iec958") || p.includes("digital-output-spdif")) return "spdif";
        if (p.includes("speaker") || p.includes("analog-output-speaker")) return "speaker";
        if (p.includes("lineout") || p.includes("line-out") || p.includes("line_out") ||
            p.includes("analog-output-lineout"))                          return "lineout";
        return "analog";
    },

    // -----------------------------------------------------------------------
    // Icon-Name für Sink/Port
    // -----------------------------------------------------------------------
    _iconName: function (sType, pType) {
        if (sType === "bluetooth")                            return "bluetooth-active";
        if (sType === "usb")                                  return "audio-headset";
        if (sType === "hdmi"     || pType === "hdmi")         return "video-display";
        if (pType === "headphone")                            return "audio-headphones";
        if (pType === "spdif")                                return "audio-card";
        if (pType === "lineout"  || pType === "speaker")      return "audio-speakers";
        return "audio-card";
    },

    // -----------------------------------------------------------------------
    // Lesbarer Anzeigename für Sink/Port
    // -----------------------------------------------------------------------
    _displayName: function (sink, port, sType) {
        if (sType === "bluetooth") return sink.desc || "Bluetooth";
        if (sType === "usb")       return sink.desc || "USB-Audio";
        if (port) {
            let pt = this._portType(port.name);
            if (pt === "headphone") return "Kopfhörer";
            if (pt === "lineout")   return "Lautsprecher (Line-out)";
            if (pt === "speaker")   return "Lautsprecher";
            if (pt === "spdif")     return "S/PDIF";
            // HDMI/DisplayPort: Port-Label von pactl verwenden (z.B. "HDMI / DisplayPort 2")
            if (pt === "hdmi")      return port.label || sink.desc || "HDMI";
        }
        if (sType === "hdmi") return sink.desc || "HDMI";
        return sink.desc || sink.name;
    },

    // -----------------------------------------------------------------------
    // Auf Sink (+Port) umschalten und alle aktiven Streams verschieben
    // -----------------------------------------------------------------------
    _switchTo: function (sink, port) {
        // 1. Port setzen (vor Default-Sink, damit Cinnamon nicht zurückfällt)
        if (port) {
            GLib.spawn_command_line_async(
                "pactl set-sink-port " + sink.id + " " + port.name
            );
        }

        // 2. Standard-Sink setzen
        GLib.spawn_command_line_async("pactl set-default-sink " + sink.id);

        // 3. Alle laufenden Streams auf den neuen Sink verschieben
        let inputs = spawnSync("pactl list short sink-inputs");
        if (inputs) {
            for (let line of inputs.split("\n")) {
                let id = line.trim().split(/\s+/)[0];
                if (id && /^\d+$/.test(id)) {
                    GLib.spawn_command_line_async(
                        "pactl move-sink-input " + id + " " + sink.id
                    );
                }
            }
        }

        this.menu.close();

        // Icon sofort aktualisieren
        let sType = this._sinkType(sink.name);
        let pType = port ? this._portType(port.name) : this._portType(sink.activePort);
        this.set_applet_icon_symbolic_name(this._iconName(sType, pType));
        let label = this._displayName(sink, port, sType);
        this.set_applet_tooltip("Aktiv: " + label + "\nKlicken zum Wechseln");
    },

    // -----------------------------------------------------------------------
    // Panel-Icon anhand des aktuellen Standard-Sinks aktualisieren
    // -----------------------------------------------------------------------
    _refreshIcon: function () {
        let sinks      = this._parseSinks();
        let defaultSink = this._getDefaultSink();
        let active     = sinks.find(function (s) { return s.name === defaultSink; });

        if (active) {
            let sType = this._sinkType(active.name);
            let pType = this._portType(active.activePort);
            this.set_applet_icon_symbolic_name(this._iconName(sType, pType));
            let label = this._displayName(
                active,
                active.ports.find(function (p) { return p.name === active.activePort; }),
                sType
            );
            this.set_applet_tooltip("Aktiv: " + label + "\nKlicken zum Wechseln");
        } else {
            this.set_applet_icon_symbolic_name("audio-card");
            this.set_applet_tooltip("Audio-Ausgang wechseln");
        }
    },

    // -----------------------------------------------------------------------
    // Menü beim Öffnen neu aufbauen (immer aktuell)
    // -----------------------------------------------------------------------
    _buildMenu: function () {
        this.menu.removeAll();

        let sinks       = this._parseSinks();
        let defaultSink = this._getDefaultSink();

        if (sinks.length === 0) {
            this.menu.addMenuItem(
                new PopupMenu.PopupMenuItem("Keine Audio-Ausgänge gefunden")
            );
            return;
        }

        for (let sink of sinks) {
            let sType = this._sinkType(sink.name);

            // Bluetooth / USB-Audio: ein Eintrag pro Sink
            // HDMI-Sinks mit mehreren Ports (z.B. GPU mit 4 Ausgängen)
            // werden wie analoge Sinks behandelt und zeigen jeden Port einzeln.
            if (sType === "bluetooth" || sType === "usb" || sink.ports.length === 0) {
                let pType    = this._portType(sink.activePort);
                let icon     = this._iconName(sType, pType);
                let label    = this._displayName(sink, null, sType);
                let isActive = sink.name === defaultSink;

                let item = new PopupMenu.PopupIconMenuItem(
                    label + (isActive ? "   ✓" : ""),
                    icon,
                    St.IconType.SYMBOLIC
                );
                // Closure über Kopie der Referenzen
                (function (s) {
                    item.connect("activate", Lang.bind(this, function () {
                        this._switchTo(s, null);
                    }));
                }).call(this, sink);

                this.menu.addMenuItem(item);
                continue;
            }

            // Analoge Sinks: pro Port ein Eintrag
            for (let port of sink.ports) {
                let pType    = this._portType(port.name);
                let icon     = this._iconName(sType, pType);
                let label    = this._displayName(sink, port, sType);
                let isActive = sink.name === defaultSink && port.name === sink.activePort;

                let item = new PopupMenu.PopupIconMenuItem(
                    label + (isActive ? "   ✓" : ""),
                    icon,
                    St.IconType.SYMBOLIC
                );
                (function (s, p) {
                    item.connect("activate", Lang.bind(this, function () {
                        this._switchTo(s, p);
                    }));
                }).call(this, sink, port);

                this.menu.addMenuItem(item);
            }
        }
    },

    // -----------------------------------------------------------------------
    // Klick auf das Applet-Icon
    // -----------------------------------------------------------------------
    on_applet_clicked: function (event) {
        this._buildMenu();
        this.menu.toggle();
    },

    // -----------------------------------------------------------------------
    // Aufräumen beim Entfernen aus der Leiste
    // -----------------------------------------------------------------------
    on_applet_removed_from_panel: function () {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
    }
};

// ---------------------------------------------------------------------------
// Einstiegspunkt
// ---------------------------------------------------------------------------
function main(metadata, orientation, panel_height, instance_id) {
    return new AudioOutputSwitcher(metadata, orientation, panel_height, instance_id);
}
