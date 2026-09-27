import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Record the actual running course and abort if its tutor or keyboard fails.
// The output is used directly in the narrated demo; no fake interface layers.
const outDir = resolve('artifacts/qr-course-demo/recordings');
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: '/repl/tools/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
const apiErrors = [];
page.on('response', response => {
  if (response.url().includes('/api/') && response.status() >= 400) {
    apiErrors.push(`${response.status()} ${response.url()}`);
  }
});
const markers = {};
const started = performance.now();
function mark(stage) {
  markers[stage] = Number(((performance.now() - started) / 1000).toFixed(2));
  console.log(stage, markers[stage]);
}
async function hold(stage, seconds) {
  const remaining = seconds * 1000 - (performance.now() - started - markers[stage] * 1000);
  if (remaining > 0) await page.waitForTimeout(remaining);
}

try {
  await page.goto('http://localhost:80/', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('button-start').waitFor();
  mark('landing');
  await hold('landing', 6);

  await page.getByTestId('button-start').click();
  await page.getByRole('heading', { name: 'Algebra 1', exact: true }).waitFor();
  await page.getByText('Week 1: Expressions and linear equations').waitFor();
  mark('dashboard');
  await hold('dashboard', 8);

  await page.locator('a[href="/weeks/1"]').first().click();
  const firstLecture = page.locator('a[href^="/lectures/"]').first();
  await firstLecture.waitFor();
  mark('week');
  await hold('week', 8);
  await firstLecture.click();
  await page.getByTestId('input-math-chat').waitFor();
  mark('lecture');
  await page.getByTestId('button-level-short').click();
  await hold('lecture', 11);

  const dismissSuggestions = page.getByTestId('button-dismiss-all-suggestions');
  if (await dismissSuggestions.isVisible()) await dismissSuggestions.click();
  mark('tutor');
  const input = page.getByTestId('input-math-chat');
  await input.fill('Why does subtracting a negative make a positive? Show me with ');
  const minus = page.getByTestId('mathkb-key-Numbers-−');
  await minus.click();
  await input.type('3 ', { delay: 80 });
  await minus.click();
  await input.type(' (', { delay: 80 });
  await minus.click();
  await input.type('4).', { delay: 80 });
  const question = await input.inputValue();
  if (!question.includes('−3 − (−4)')) throw new Error(`Math keyboard did not insert at caret: ${question}`);
  await page.getByTestId('button-send-math-chat').click();
  const response = await page.waitForResponse(
    result => result.url().includes('/api/tutor/ask') && result.request().method() === 'POST',
    { timeout: 60000 },
  );
  const tutor = await response.json();
  if (response.status() !== 200 || !tutor.text || tutor.text.includes('trouble reaching')) {
    throw new Error(`Tutor did not return a usable answer: ${JSON.stringify(tutor)}`);
  }
  const renderedReply = page.getByTestId('chat-message-tutor').last();
  await renderedReply.waitFor({ timeout: 10000 });
  await renderedReply.scrollIntoViewIfNeeded();
  const replyBounds = await renderedReply.boundingBox();
  if (!replyBounds || replyBounds.y >= 720 || replyBounds.y + replyBounds.height <= 0) {
    throw new Error('Tutor replied but its answer is not in the recorded viewport');
  }
  mark('reply');
  console.log('Verified real tutor response:', tutor.text.slice(0, 120));
  await hold('tutor', 20);
  await page.waitForTimeout(8_000);

  await page.goto('http://localhost:80/assignments', { waitUntil: 'domcontentloaded' });
  const homework = page.getByText('Homework 1.1 — Expressions and equations').first();
  await homework.waitFor();
  mark('homework');
  await page.waitForTimeout(3_000);
  await page.locator('a[href^="/assignments/"]').first().click();
  const answer = page.getByTestId('input-answer').first();
  await answer.waitFor();
  await answer.fill('a(b+c)');
  await page.getByTestId('mathkb-key-Numbers-=').first().click();
  await answer.type('ab+ac', { delay: 140 });
  const result = await answer.inputValue();
  if (result !== 'a(b+c)=ab+ac') throw new Error(`Assignment keyboard did not insert correctly: ${result}`);
  await answer.scrollIntoViewIfNeeded();
  await hold('homework', 16);

  if (apiErrors.length) throw new Error(`API responses failed: ${apiErrors.join(', ')}`);
  await page.screenshot({ path: `${outDir}/algebra-last-frame.png` });
  await context.close();
  await page.video().saveAs(`${outDir}/algebra-app-footage.webm`);
  await writeFile(`${outDir}/algebra-markers.json`, JSON.stringify({ markers, question, tutor: tutor.text, answer: result }, null, 2));
  console.log('Recorded and checked the running Algebra 1 app.');
} finally {
  await browser.close();
}