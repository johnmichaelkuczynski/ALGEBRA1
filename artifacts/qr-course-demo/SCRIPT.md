# Algebra 1 — real-app walkthrough (16:9)

## Production rules

- Footage: continuous 1280 × 720 recording of the running Algebra 1 app, made with `scripts/record-app.mjs`. No UI reconstruction, overlay, crop, title card, or transition.
- Sound: masculine English narration only. No music, sound effects, or recorded system audio.
- The recording verifies math-key insertion in chat and homework, an actual successful tutor API response, and a visible tutor message. It does not submit a graded homework answer.
- `recordings/algebra-markers.json` holds the real action times. `scripts/render-video.mjs` places the six voice clips against those markers and writes the MP4 and poster in `public/`.

## Narration, in screen order

1. **Landing page — start the course.** “This is Algebra 1. Start with a clear, four-week path through twenty-nine short lessons.”
2. **Dashboard — see the course schedule.** “The dashboard shows your lessons, assignments, and progress in one place.”
3. **Week 1 — open real numbers and operations.** “Choose a week and open a lesson. Real numbers and operations build the foundation for solving equations.”
4. **Lecture and tutor input.** “Read a focused explanation and a real example. If you need more detail, adjust the lesson depth or ask a question.”
5. **Type a question with the math keyboard, send it, and leave the real tutor answer on screen.** “Use the math keyboard to put symbols into a question. The tutor responds with a step-by-step explanation tied to the lesson.”
6. **Homework — enter a symbolic answer using a math key.** “The same keyboard is here for homework and exams, making it easier to write formulas and solve problems directly in the app.”

The runtime is paced by the app and the actual tutor request rather than by a fixed storyboard. The video finishes on the unsubmitted homework answer inside the app.