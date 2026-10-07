# Wipi ☕

**Language:** English · [Español](README.es.md)

**A small focus desk for Windows.** Keep track of multiple Codex tasks without switching windows, and get gentle alerts when they finish. Wipi has an animated coffee cup, five color themes, and a floating bar you can drag anywhere on your desktop.

<img src="docs/images/wipi-bar.png" alt="Wipi bar showing two sample projects in progress" width="438">

<details>
<summary>See the activity panel</summary>

<img src="docs/images/wipi-panel.png" alt="Wipi panel showing sample active projects and recent alerts" width="460">

There is also a [light Pearl theme](docs/images/wipi-pearl.png).

</details>

> Screenshots use fictional project names. They contain no real conversations or projects.

## What Wipi does

- Shows how many Codex tasks are running and which projects they belong to.
- Shows the last recorded step, such as analysis, commands, tools, file edits, or a response. This is an activity signal, not a progress percentage.
- Displays a brief alert when a task finishes and keeps the latest 30 alerts while Wipi is open.
- Lets you drag the bar anywhere on your desktop. Wipi remembers its position; the tray menu can return it to the top center.
- Offers **Graphite**, **Pearl**, **Violet**, **Mint**, and **Sunset** themes. The tray menu also lets you test an alert, start Wipi with Windows, and quit.

## Available integrations

| Source | Active tasks | Completion alerts | Setup |
| --- | --- | --- | --- |
| Codex Desktop | Yes, from local sessions | Yes | Automatic when Codex saves local sessions |
| Codex CLI | Yes, when it writes local sessions | Yes | The optional `notify` bridge adds a short response summary |
| ChatGPT web | Not yet | Yes, with the included extension | Load the extension in Chrome or Edge |
| ChatGPT Desktop | Not yet | Not yet | Unavailable |

Wipi checks local Codex events every 2.5 seconds. A session with no new activity for ten minutes is marked **No recent activity** and no longer counts as active. The displayed step is the last recorded event, not a precise reading of what Codex is doing at that moment.

## Get started

### Run from source

Tested on Windows with Node.js 24 and npm 11. Clone or download the repository, then open PowerShell in its root folder:

```powershell
npm.cmd ci
npm.cmd start
```

The first run may download the Electron runtime. Wipi will appear as a floating bar and a system tray icon.

### Build Windows executables

```powershell
npm.cmd run dist
```

This creates an installer and a portable executable in `dist/`. Git ignores that folder; upload the executables as assets of a **GitHub Release** to distribute them. Current builds are not code signed.

### Connect Codex CLI through `notify` (optional)

With Wipi open, run this from the repository root:

```powershell
node scripts\install-codex-hook.js
```

The script updates your user-level `config.toml`, creates `config.toml.wipi-backup`, and preserves any previous `notify` command. Restart Codex CLI to load the change. Keep the repository at the same path: the hook stores the absolute path to `scripts/codex-notify.js`.

### Connect ChatGPT web (optional)

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
2. Enable **Developer mode** and choose **Load unpacked**.
3. Select this repository's `chatgpt-extension/` folder.
4. Open Wipi's system tray menu and choose **Open settings folder**.
5. Copy the `token` value from `settings.json` into the extension. Click **Save**, then **Test**.

The extension alerts Wipi when a response finishes on `chatgpt.com`. It does not send the conversation text. Detection depends on ChatGPT's web interface and may need updates when that interface changes.

## Documentation

The detailed guides below are currently in Spanish:

- [Installation and use](docs/installation.md)
- [Integrations and activity states](docs/integrations.md)
- [Privacy and local security](docs/privacy.md)
- [Development and screenshots](docs/development.md)
- [Ideas for future versions](docs/roadmap.md)
- [Documentation index](docs/README.md)

## Current limitations

- Wipi does not measure progress percentages. It processes Codex session files locally to extract status, but does not display or send conversation content.
- It does not track in-progress ChatGPT web responses or notifications from the ChatGPT Desktop app.
- The Codex Desktop integration depends on its local session format, which may change in a Codex update.
- Alert history stays in memory and is cleared when Wipi quits.

For bug reports, include your Windows and Wipi versions, the alert source, and steps to reproduce the issue. **Do not attach** `settings.json`, tokens, or complete conversations.

## License

[MIT](LICENSE). Wipi is an independent project and is not affiliated with OpenAI.
