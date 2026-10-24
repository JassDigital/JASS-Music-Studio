# JASS Music Studio

A local-first, SUNO-inspired music creation workspace. The first MVP includes a dark music studio UI, prompt presets, an ElevenLabs Music API route, session library, playback, and MP3 downloads.

## Requirements

- Node.js 22 LTS or newer compatible with Next.js 15
- npm
- An ElevenLabs account with Music API access and an API key to generate real audio

## Run on Windows

1. Extract this folder to a workspace such as `D:\\Github\\JASS-Music-Studio`.
2. Open PowerShell in the project folder.
3. Install dependencies:

   ```powershell
   npm install
   ```

4. Copy the example environment file and edit it:

   ```powershell
   Copy-Item .env.example .env.local
   notepad .env.local
   ```

5. Add your own key after `ELEVENLABS_API_KEY=` and save. Keep `.env.local` private; it is excluded by `.gitignore`.
6. Start the development server:

   ```powershell
   npm run dev
   ```

7. Open http://localhost:3000.

Without an API key, the interface opens and shows setup guidance, but real generation remains disabled. No fake audio is generated.

## First MVP behaviour

- Prompt-based music generation using `POST https://api.elevenlabs.io/v1/music`.
- Durations: 15, 30, 60, or 120 seconds (availability and provider constraints may vary).
- Instrumental option.
- Session-only library: generated audio stays in browser memory until the page is refreshed or closed. Download tracks you want to keep.
- API key is read by the server route only and is never exposed to client-side JavaScript.

## Important limitations in this MVP

- The library is not yet persistent and there are no user accounts.
- The provider's account, plan, current API access, quotas, and billing determine whether a generation succeeds.
- Prompt-based composition is implemented. Advanced lyric section planning, revisions, playlists, cloud storage, and deployment are later milestones.
- Review ElevenLabs' current API docs, terms, and pricing before public/commercial release.

## Useful commands

```powershell
npm run dev
npm run build
npm start
```

## Project structure

```text
JASS-Music-Studio/
  app/
    api/music/route.ts   # Server-side provider proxy; API key stays server-side
    globals.css          # Responsive dark studio design
    layout.tsx           # App metadata and global styles
    page.tsx             # Music studio, library, player, and setup UI
  .env.example           # Safe environment-variable template
  .gitignore
  package.json
  tsconfig.json
  README.md
```
