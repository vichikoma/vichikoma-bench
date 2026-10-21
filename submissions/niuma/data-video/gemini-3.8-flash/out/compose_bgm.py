import sys
import os
import json

# Add musiclib directory
LIBDIR = os.environ.get("LIBDIR", r"C:\Users\whales\AppData\Roaming\slimory-team\skills\published\public\music-gen\scripts")
sys.path.insert(0, LIBDIR)
import musiclib as mg

# BPM = 124, 15 bars of 4/4 = 60 beats = 29.032258 seconds
BPM = 124
BARS = 15

p = mg.Piece(bpm=BPM, bars=BARS)

# C Major / A Minor pentatonic / pop friendly: C D E G A
# Major scale
MAJOR = [0, 2, 4, 5, 7, 9, 11]
TONIC = mg.note_to_midi('C4') # 60
BASS_TONIC = mg.note_to_midi('C2') # 36

# Tracks:
# Drums
drums = p.track("drums", 0, pan=64, volume=120, drums=True)

# Bass (Synth Bass or Finger Bass)
bass = p.track("bass", mg.GM['synth_bass'], pan=64, volume=115)

# Synth Pluck / Electric Piano (Left & Right for stereo width)
keys_l = p.track("keys_l", mg.GM['electric_piano'], pan=15, volume=95)
keys_r = p.track("keys_r", mg.GM['bright_piano'], pan=112, volume=95)

# Lead synth / Brass / Saw lead
lead = p.track("lead", mg.GM['square_lead'], pan=70, volume=105)
brass = p.track("brass", mg.GM['brass_section'], pan=55, volume=100)

# Chords progression (in C Major):
# Intro (Bar 0-1): C - G (high energy start)
# Section 1 (Bar 2-4): Am - F - G
# Section 2 (Bar 5-7): C - Em - F
# Climax (Bar 8-11): Am - F - C - G
# Ending (Bar 12-14): F - G - C (final resolutive hit on bar 14 beat 0, ring out)

progression = [
    # Bar 0-1: Intro
    ('C', 'C', [0, 4, 7]),
    ('G', 'G', [-1, 2, 7]),
    # Bar 2-4: Scene 1
    ('Am', 'A', [-3, 0, 4]),
    ('F', 'F', [-5, -1, 4]),
    ('G', 'G', [-1, 2, 7]),
    # Bar 5-7: Scene 2
    ('C', 'C', [0, 4, 7]),
    ('Em', 'E', [-5, -1, 4]),
    ('F', 'F', [-5, -1, 4]),
    # Bar 8-11: Scene 3 (Climax)
    ('Am', 'A', [-3, 0, 4]),
    ('F', 'F', [-5, -1, 4]),
    ('C', 'C', [0, 4, 7]),
    ('G', 'G', [-1, 2, 7]),
    # Bar 12-14: Outro
    ('F', 'F', [-5, -1, 4]),
    ('G', 'G', [-1, 2, 7]),
    ('C', 'C', [0, 4, 7]),
]

root_offsets = {
    'C': 0, 'G': 7, 'Am': 9, 'F': 5, 'Em': 4
}

for bar_idx in range(BARS):
    chord_name, root_note, chord_intervals = progression[bar_idx]
    bar_start = bar_idx * 4
    root_midi = TONIC + root_offsets[chord_name]
    bass_midi = BASS_TONIC + root_offsets[chord_name]

    # --- DRUMS ---
    if bar_idx < 14:
        # Standard upbeat 4-on-the-floor dance pop beat
        for b in range(4):
            beat = bar_start + b
            # Kick on 1, 2, 3, 4
            drums.note(beat, mg.DRUMS['kick'], 0.5, 110)
            # Snare/Clap on 2 and 4
            if b in [1, 3]:
                drums.note(beat, mg.DRUMS['snare'], 0.5, 115)
                drums.note(beat, mg.DRUMS['clap'], 0.5, 90)
            # Hi-hat on every eighth note
            drums.note(beat, mg.DRUMS['hh_closed'], 0.25, 85)
            drums.note(beat + 0.5, mg.DRUMS['hh_open'] if b in [1, 3] else mg.DRUMS['hh_closed'], 0.25, 95)
        
        # Crash on key transition bars
        if bar_idx in [0, 2, 5, 8, 12]:
            drums.note(bar_start, mg.DRUMS['crash'], 2.0, 115)
            
        # Climax extra energy (bars 8-11)
        if 8 <= bar_idx <= 11:
            drums.note(bar_start + 3.5, mg.DRUMS['snare'], 0.25, 100)
            drums.note(bar_start + 3.75, mg.DRUMS['snare'], 0.25, 110)
    else:
        # Final bar 14: big final hit on beat 0, crash, then let ring
        drums.note(bar_start, mg.DRUMS['kick'], 1.0, 125)
        drums.note(bar_start, mg.DRUMS['snare'], 1.0, 125)
        drums.note(bar_start, mg.DRUMS['crash'], 4.0, 127)

    # --- BASS ---
    if bar_idx < 14:
        # 16th pumping groove: 0, 0.75, 1.5, 2.0, 2.75, 3.5
        rhythm = [0, 0.75, 1.5, 2.0, 2.75, 3.5]
        for r_pos in rhythm:
            bass.note(bar_start + r_pos, bass_midi, 0.4, 105 if r_pos in [0, 2.0] else 90)
    else:
        bass.note(bar_start, bass_midi, 4.0, 120)

    # --- KEYS / CHORDS (Stereo Arp & Stabs) ---
    chord_pitches = [root_midi + iv for iv in chord_intervals]
    if bar_idx < 14:
        # Syncopated stabs on & of 1, 2, & of 3, 4
        keys_l.chord(bar_start + 0.5, chord_pitches, 0.4, 95)
        keys_l.chord(bar_start + 1.5, chord_pitches, 0.4, 90)
        keys_l.chord(bar_start + 2.5, chord_pitches, 0.4, 95)
        keys_l.chord(bar_start + 3.5, chord_pitches, 0.4, 90)

        keys_r.chord(bar_start, chord_pitches, 0.3, 100)
        keys_r.chord(bar_start + 1.0, chord_pitches, 0.3, 90)
        keys_r.chord(bar_start + 2.0, chord_pitches, 0.3, 100)
        keys_r.chord(bar_start + 3.0, chord_pitches, 0.3, 90)
    else:
        keys_l.chord(bar_start, chord_pitches, 4.0, 110)
        keys_r.chord(bar_start, [p + 12 for p in chord_pitches], 4.0, 110)

    # --- BRASS & LEAD (Melody & Accents) ---
    if bar_idx in [0, 1]:
        # Intro energetic riff
        lead.note(bar_start + 0, TONIC + 12, 0.5, 100)
        lead.note(bar_start + 0.5, TONIC + 14, 0.5, 100)
        lead.note(bar_start + 1.0, TONIC + 16, 0.75, 105)
        lead.note(bar_start + 2.0, TONIC + 19, 1.0, 110)
    elif 2 <= bar_idx <= 4:
        # Scene 1: steady supportive melody
        brass.chord(bar_start, [root_midi, root_midi + 7], 1.5, 85)
        lead.note(bar_start + 2.0, TONIC + 12, 0.5, 90)
        lead.note(bar_start + 2.5, TONIC + 14, 0.5, 95)
        lead.note(bar_start + 3.0, TONIC + 16, 0.75, 100)
    elif 5 <= bar_idx <= 7:
        # Scene 2: climbing melody
        brass.chord(bar_start, [root_midi, root_midi + 4 if 'm' not in chord_name else root_midi + 3], 1.5, 90)
        lead.note(bar_start + 1.0, TONIC + 14, 0.5, 95)
        lead.note(bar_start + 2.0, TONIC + 16, 0.5, 100)
        lead.note(bar_start + 3.0, TONIC + 19, 0.75, 105)
    elif 8 <= bar_idx <= 11:
        # Scene 3: CLIMAX! Big brass stabs & driving lead
        brass.chord(bar_start, [root_midi + 12, root_midi + 16, root_midi + 19], 0.75, 115)
        brass.chord(bar_start + 1.5, [root_midi + 12, root_midi + 16, root_midi + 19], 0.75, 115)
        brass.chord(bar_start + 3.0, [root_midi + 12, root_midi + 16, root_midi + 19], 0.75, 115)
        
        lead.note(bar_start + 0, TONIC + 19, 0.5, 110)
        lead.note(bar_start + 0.5, TONIC + 21, 0.5, 110)
        lead.note(bar_start + 1.0, TONIC + 24, 1.0, 120)
        lead.note(bar_start + 2.5, TONIC + 21, 0.5, 110)
        lead.note(bar_start + 3.0, TONIC + 19, 0.75, 110)
    elif 12 <= bar_idx <= 13:
        # Outro ramp down
        brass.chord(bar_start, [root_midi, root_midi + 7, root_midi + 12], 2.0, 100)
        lead.note(bar_start + 0, TONIC + 16, 1.0, 95)
        lead.note(bar_start + 2.0, TONIC + 14, 1.0, 95)
    elif bar_idx == 14:
        # Final chord hit
        final_chord = [TONIC, TONIC + 4, TONIC + 7, TONIC + 12, TONIC + 16]
        brass.chord(bar_start, final_chord, 4.0, 120)
        lead.note(bar_start, TONIC + 19, 4.0, 120)

# Save midi
out_mid_path = "out/bgm.mid"
p.save(out_mid_path)
print(f"Saved MIDI to {out_mid_path}")

# Generate beats.json
# Total beats = 60 (beats 0 to 59). Seconds per beat = 60 / BPM = 60 / 124 = 0.4838709677419355
sec_per_beat = 60.0 / BPM
beats_data = {
    "bpm": BPM,
    "total_bars": BARS,
    "total_beats": BARS * 4,
    "total_duration_sec": BARS * 4 * sec_per_beat,
    "sec_per_beat": sec_per_beat,
    "beats": []
}

for i in range(BARS * 4):
    t = round(i * sec_per_beat, 4)
    bar_num = i // 4
    beat_in_bar = i % 4
    is_downbeat = (beat_in_bar == 0)
    beats_data["beats"].append({
        "beat_index": i,
        "time_sec": t,
        "bar": bar_num,
        "beat_in_bar": beat_in_bar,
        "is_downbeat": is_downbeat
    })

with open("out/beats.json", "w", encoding="utf-8") as f:
    json.dump(beats_data, f, indent=2, ensure_ascii=False)
print("Saved beats.json to out/beats.json")
