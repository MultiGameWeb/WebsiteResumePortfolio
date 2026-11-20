// Premium voice: records the owner's voice and the Worker turns it into text
// with ElevenLabs. Used by the owner page and the setup chat when the server
// says premium voice is on (view.premiumVoice). Nothing is stored.

const MAX_SECONDS = 60;
const TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export const premiumRecordingSupported = () =>
  Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && !window.BOTCRAFT_DEMO);

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

// start() begins recording; the returned handle's stop() resolves with
// { text } or { error, fallback }. cancel() throws the recording away.
export async function startRecording({ apiBase, shopId }) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  let cancelled = false;
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  const finished = new Promise((resolve) => { recorder.onstop = resolve; });
  recorder.start();
  const timer = window.setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, MAX_SECONDS * 1000);
  const release = () => { window.clearTimeout(timer); stream.getTracks().forEach((track) => track.stop()); };

  return {
    // Resolves when recording ends (stop() was called, or the time limit hit).
    ended: finished,
    async stop() {
      if (recorder.state === 'recording') recorder.stop();
      await finished;
      release();
      if (cancelled || !chunks.length) return { text: '' };
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
      try {
        const response = await fetch(`${apiBase}/api/botcraft/owner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopId, action: 'transcribe', audio: { mimeType: blob.type, data: await toBase64(blob) } }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.ok) return { text: String(data.text || '') };
        return { error: data.error || 'Could not turn your voice into text.', fallback: Boolean(data.fallback) };
      } catch {
        return { error: 'Could not reach the server. Please try again.', fallback: true };
      }
    },
    cancel() {
      cancelled = true;
      if (recorder.state === 'recording') recorder.stop();
      release();
    },
  };
}
