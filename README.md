<p align="center">
  <h1 align="center">⚓ Bosun</h1>
  <p align="center">A filament manager panel for Mainsail/Klipper</p>
</p>

<p align="center">
  <a aria-label="License" href="https://github.com/Swiizide/mainsail-filament/blob/develop/LICENSE">
    <img src="https://img.shields.io/github/license/Swiizide/mainsail-filament?style=flat-square">
  </a>
  <a aria-label="Last commit" href="https://github.com/Swiizide/mainsail-filament/commits/">
    <img src="https://img.shields.io/github/last-commit/Swiizide/mainsail-filament?style=flat-square">
  </a>
  <a aria-label="Version" href="https://github.com/Swiizide/mainsail-filament/releases">
    <img src="https://img.shields.io/github/v/release/Swiizide/mainsail-filament?style=flat-square">
  </a>
</p>

---

Bosun is a filament management panel built as a fork of [Mainsail](https://github.com/mainsail-crew/mainsail).

## Features

- **Filament tracking** — Add, edit and delete filament spools with brand, type, colour, weight and correction factor
- **Roll IDs** — Each spool gets a unique 4-character ID (e.g. `A3B2`) for real-world identification
- **Smart weight calculation** — Enter any two of filament weight, spool weight and total weight and the third calculates automatically
- **Low filament warnings** — Configurable per-spool warning threshold with visual indicators
- **Colour picker** — Full colour picker for each filament
- **Presets** — Save filament profiles as reusable presets for quick entry of new spools
- **Refill button** — Quickly add a fresh spool of the same filament
- **Active filament selector** — Track which filament is currently loaded
- **Load/Unload automation** — Buttons that home, raise Z to 50mm, heat the extruder and wait 60 seconds before turning off
- **Per-print weight deduction** — Automatically deducts estimated usage from remaining weight after each print
- **Smart correction factor** — Compares actual vs estimated usage over multiple weigh-ins and automatically refines the correction factor per filament type (for all you nerds out there)
- **Filament log** — Writes a log to `config/filament_log.txt` with each load→unload cycle

## Requirements

- Klipper
- Moonraker
- Mainsail (this is a fork of Mainsail, not a plugin)

## Installation

Bosun replaces your existing Mainsail installation. Your Klipper/Moonraker setup is not affected.

**1. Download the latest release**

Go to the [Releases](https://github.com/Swiizide/mainsail-filament/releases) page and download `mainsail.zip`.

**2. Back up your existing Mainsail**

```bash
cp -r ~/mainsail ~/mainsail_backup
```

**3. Extract and deploy**

```bash
cd ~/mainsail
rm -rf ./*
unzip /path/to/mainsail.zip -d ./
```

Or via SCP from your PC after building locally:

```bash
scp -r dist/* USER@YOUR_PRINTER_IP:/home/USER/mainsail/
```

**4. Refresh Mainsail in your browser**

That's it — the Bosun panel will appear on your dashboard.

## Building from source

```bash
git clone https://github.com/Swiizide/mainsail-filament.git
cd mainsail-filament
npm install
npm run serve    # development server
npm run build    # production build
```

## Updating

Download the latest release and repeat the installation steps, or build from source and redeploy.

## Data storage

All filament data is stored in Moonraker's database under the `mainsail` namespace — the same place Mainsail stores its own settings. Your filament data persists across browser refreshes and Mainsail updates.

A log of load→unload cycles is written to `config/filament_log.txt`, accessible via Machine → Config Files in Mainsail.

## Planned features

- Filament sensor integration for automatic load/unload detection
- Nozzle diameter tracking and automatic printer config updates

## Credits

- [Mainsail](https://github.com/mainsail-crew/mainsail)
- [Kevin O'Connor](https://github.com/KevinOConnor) for [Klipper](https://github.com/KevinOConnor/klipper)
- [Eric Callahan (arksine)](https://github.com/Arksine) for [Moonraker](https://github.com/Arksine/moonraker)

## License

Bosun is licensed under the same license as Mainsail. See [LICENSE](LICENSE) for details.
