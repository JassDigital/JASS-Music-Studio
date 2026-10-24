"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  durationSeconds: number;
  instrumental: boolean;
  url: string;
  size: number;
};

const examples = [
  { title: "Rosa — You Are My Forever", style: "Romantic pop · Warm male vocal", prompt: "A deeply romantic English pop ballad, warm mature male baritone, gentle piano, acoustic guitar, emotional chorus, nostalgic and sincere, polished studio production." },
  { title: "Punjabi Golden Hour", style: "Punjabi · Modern folk", prompt: "A melodic Punjabi romantic song with expressive male vocals, tumbi, dhol, warm acoustic guitar and modern pop production, heartfelt lyrics and a memorable chorus." },
  { title: "Quiet Mountain Roads", style: "Cinematic · Instrumental", prompt: "Peaceful cinematic instrumental for a scenic mountain road trip, fingerpicked acoustic guitar, soft piano, gentle strings, gradual emotional build, wide open-air atmosphere." },
];

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function Home() {
  const [prompt, setPrompt] = useState(examples[0].prompt);
  const [title, setTitle] = useState("My new song");
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [instrumental, setInstrumental] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch("/api/music").then(r => r.json()).then(d => setConfigured(Boolean(d.configured))).catch(() => setConfigured(false));
    return () => tracks.forEach(track => URL.revokeObjectURL(track.url));
    // This is only a cleanup for the current in-memory session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTrack = tracks.find(t => t.id === activeTrackId) ?? null;
  const filteredTracks = useMemo(() => tracks.filter(t => `${t.title} ${t.prompt}`.toLowerCase().includes(query.toLowerCase())), [tracks, query]);

  async function generate() {
    setError("");
    if (!prompt.trim()) { setError("Write a short description of the song first."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, durationSeconds, instrumental }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed (${response.status}).`);
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The provider returned an empty audio file.");
      const url = URL.createObjectURL(blob);
      const track: Track = {
        id: crypto.randomUUID(),
        title: title.trim() || "Untitled track",
        prompt: prompt.trim(),
        createdAt: new Date().toISOString(),
        durationSeconds,
        instrumental,
        url,
        size: blob.size,
      };
      setTracks(current => [track, ...current]);
      setActiveTrackId(track.id);
      setConfigured(true);
      window.setTimeout(() => audioRef.current?.play().catch(() => undefined), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function downloadTrack(track: Track) {
    const a = document.createElement("a");
    a.href = track.url;
    a.download = `${track.title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "jass-track"}.mp3`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function removeTrack(id: string) {
    setTracks(current => {
      const track = current.find(t => t.id === id);
      if (track) URL.revokeObjectURL(track.url);
      return current.filter(t => t.id !== id);
    });
    if (activeTrackId === id) setActiveTrackId(null);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">J</span><span>JASS<span className="brand-light"> MUSIC</span></span></div>
        <div className="brand-subtitle">STUDIO</div>
        <nav className="nav-list">
          <a className="nav-item active" href="#create"><span>✦</span> Create</a>
          <a className="nav-item" href="#library"><span>▤</span> Library <span className="nav-count">{tracks.length}</span></a>
          <a className="nav-item" href="#ideas"><span>◷</span> Inspiration</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-badge">JM</div><div><div className="profile-name">JASS Studio</div><div className="profile-plan">Local workspace</div></div>
          <span className="status-dot" title="Local app" />
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar"><div><div className="eyebrow">YOUR PERSONAL MUSIC WORKSPACE</div><h1>Make something <span>beautiful.</span></h1></div><div className={`connection-pill ${configured ? "connected" : ""}`}><span className="connection-dot" />{configured === null ? "Checking API" : configured ? "Music API connected" : "API key needed"}</div></header>

        <section className="create-panel" id="create">
          <div className="section-heading"><div><div className="eyebrow">THE STUDIO</div><h2>Create a song</h2></div><span className="step-label">01 / CREATE</span></div>
          <label className="field-label" htmlFor="song-title">SONG TITLE</label>
          <input id="song-title" className="title-input" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="Give your song a name" />
          <div className="prompt-header"><label className="field-label" htmlFor="song-prompt">DESCRIBE YOUR SOUND</label><span className="subtle-count">{prompt.length}/2000</span></div>
          <textarea id="song-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={2000} rows={4} placeholder="Describe the mood, instruments, vocals, genre, and story..." />
          <div className="quick-prompts"><span className="quick-label">TRY A STARTING POINT</span>{examples.map(ex => <button key={ex.title} className="prompt-chip" onClick={() => { setTitle(ex.title); setPrompt(ex.prompt); setInstrumental(ex.title.includes("Instrumental")); }}>{ex.title}</button>)}</div>
          <div className="controls-row">
            <div className="control-group"><label className="field-label" htmlFor="duration">LENGTH</label><select id="duration" value={durationSeconds} onChange={e => setDurationSeconds(Number(e.target.value))}><option value={15}>15 seconds</option><option value={30}>30 seconds</option><option value={60}>60 seconds</option><option value={120}>2 minutes</option></select></div>
            <label className="instrumental-toggle"><input type="checkbox" checked={instrumental} onChange={e => setInstrumental(e.target.checked)} /><span className="toggle-track"><span /></span><span><strong>Instrumental</strong><small>No vocals</small></span></label>
            <button className="generate-button" onClick={generate} disabled={busy || configured === false}><span className="sparkle">✦</span>{busy ? "Creating your song…" : "Generate song"}<span className="arrow">↗</span></button>
          </div>
          {configured === false && <div className="setup-note"><span>ⓘ</span><div><strong>One quick setup step</strong><p>Add your ElevenLabs API key to <code>.env.local</code> to enable real music generation. See <a href="#setup">setup instructions</a> below.</p></div></div>}
          {error && <div className="error-message" role="alert">{error}</div>}
          {busy && <div className="generating-status"><span className="pulse-dot"/> Sending your prompt to the music studio. Longer generations can take a little while.</div>}
        </section>

        <section className="library-section" id="library">
          <div className="section-heading library-heading"><div><div className="eyebrow">YOUR COLLECTION</div><h2>Music library <span className="count-badge">{tracks.length}</span></h2></div><div className="library-tools"><input aria-label="Search library" value={query} onChange={e => setQuery(e.target.value)} placeholder="⌕  Search songs"/><button className="sort-button" onClick={() => setTracks(current => [...current].reverse())}>↕ Latest</button></div></div>
          {filteredTracks.length === 0 ? <div className="empty-library"><div className="empty-art"><span>♫</span><i>✦</i><b>♪</b></div><h3>{tracks.length ? "No matching songs" : "Your next favourite song starts here."}</h3><p>{tracks.length ? "Try another search term." : "Songs you generate in this session will appear here, ready to play or download."}</p><a href="#create" className="text-link">Back to the studio <span>↗</span></a></div> : <div className="track-list">{filteredTracks.map((track, index) => <article className={`track-row ${track.id === activeTrackId ? "selected" : ""}`} key={track.id}><button className={`cover-art cover-${index % 4}`} onClick={() => setActiveTrackId(track.id)} aria-label={`Select ${track.title}`}><span>{index % 2 === 0 ? "♫" : "✦"}</span><i /></button><button className="track-info" onClick={() => setActiveTrackId(track.id)}><strong>{track.title}</strong><span>{track.instrumental ? "Instrumental" : "AI composition"} · {new Date(track.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><small>{track.prompt}</small></button><span className="track-duration">{formatTime(track.durationSeconds)}</span><button className="icon-button" onClick={() => downloadTrack(track)} title="Download MP3" aria-label="Download MP3">↓</button><button className="icon-button remove-button" onClick={() => removeTrack(track.id)} title="Remove track" aria-label="Remove track">×</button></article>)}</div>}
        </section>

        <section className="ideas-section" id="ideas"><div className="eyebrow">A LITTLE INSPIRATION</div><h2>Every feeling has a sound.</h2><div className="idea-cards">{[{n:"01",t:"The love letter",d:"Warm vocals, piano, and words that stay with you.",tag:"ROMANTIC"},{n:"02",t:"Home in the heart",d:"Punjabi folk textures with a modern, melodic pulse.",tag:"PUNJABI"},{n:"03",t:"Open roads",d:"Cinematic instrumentals for the moments between destinations.",tag:"CINEMATIC"}].map((idea,i)=><button key={idea.n} className={`idea-card idea-${i}`} onClick={()=>{setTitle(idea.t);setPrompt([examples[0].prompt,examples[1].prompt,examples[2].prompt][i]);setInstrumental(i===2);document.getElementById("create")?.scrollIntoView({behavior:"smooth"});}}><span className="idea-number">{idea.n} / {idea.tag}</span><strong>{idea.t}</strong><span className="idea-description">{idea.d}</span><span className="idea-arrow">↗</span></button>)}</div></section>
        <section className="setup-section" id="setup"><div><div className="eyebrow">GETTING STARTED</div><h2>Connect your music engine</h2><p>To generate real audio, create an API key with ElevenLabs, then save it locally. Your key stays on the server and is never sent to the browser.</p></div><ol><li>Copy <code>.env.example</code> to <code>.env.local</code>.</li><li>Paste your key after <code>ELEVENLABS_API_KEY=</code>.</li><li>Restart the app with <code>npm run dev</code>.</li></ol><a className="text-link" href="https://elevenlabs.io/app/developers/api-keys" target="_blank" rel="noreferrer">Open ElevenLabs API keys <span>↗</span></a></section>
        <footer className="footer"><span>JASS MUSIC STUDIO <span className="footer-dot">●</span> EARLY ACCESS</span><span>Made for the music in you.</span></footer>
      </section>

      <div className="player-bar"><div className="player-track"><div className="mini-cover">♫</div><div className="player-meta"><strong>{activeTrack?.title ?? "Nothing playing yet"}</strong><span>{activeTrack ? "JASS Music Studio" : "Create a song to begin listening"}</span></div></div><div className="player-center"><button className="player-play" disabled={!activeTrack} onClick={() => { if (!audioRef.current) return; if (audioRef.current.paused) audioRef.current.play().catch(() => undefined); else audioRef.current.pause(); }}>{"▶"}</button><div className="player-caption">{activeTrack ? "READY TO PLAY" : "YOUR MUSIC, YOUR MOMENT"}</div></div><div className="player-right"><span>MP3</span><span className="player-quality">HIGH QUALITY</span></div><audio ref={audioRef} src={activeTrack?.url ?? undefined} controls onEnded={() => {}} /></div>
    </main>
  );
}
