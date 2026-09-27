---
name: Narrated video export
description: A Replit FFmpeg quirk when exporting voiceover-only video from browser recordings.
---

When a narrated export pads the voiceover with silence so that it spans the full recording, give FFmpeg an explicit output duration measured from the recording instead of pairing an unlimited `apad` filter with `-shortest`.

**Why:** In this environment, the latter combination once reported “No space left on device” while finalizing an otherwise complete MP4, even though the filesystem and temporary storage had ample free space. Setting the finite duration finished cleanly.

**How to apply:** Probe the input video duration, subtract any lead-in trim, and cap the final output with that duration. Keep music and other audio inputs out of the narration-only mix when that is the requested treatment.