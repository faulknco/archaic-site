// The photosensitivity gate shared by the Forge pieces. Lifted out of
// /forge/spin unchanged in behaviour: one sessionStorage key, so accepting the
// notice on either piece covers both for the browser session; and a Tab wrap so
// keyboard focus stays inside the gate while it is open.
//
// Everything behind the gate is expected to be `inert` already (the page owns
// that, because what is behind the gate differs from piece to piece); this
// module only handles the gate itself.
export const GATE_KEY = 'spin-gate';

// Whether the visitor has already accepted the notice in this session.
// sessionStorage can throw (private windows, storage disabled); a throw means
// "not seen", never a broken page.
export function gateSeen() {
  try { return sessionStorage.getItem(GATE_KEY) === 'ok'; } catch { return false; }
}

// Wire Continue and the focus trap. Call this before any other work in the
// page module: anything that throws further down then costs the reader that
// feature, not the page — the alternative is a reader trapped behind a warning
// they cannot dismiss. `onStart` runs when Continue is pressed.
export function wireGate({ gate, begin, onStart }) {
  begin.addEventListener('click', () => {
    try { sessionStorage.setItem(GATE_KEY, 'ok'); } catch {}
    onStart();
  });
  gate.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || gate.classList.contains('closed')) return;
    const focusable = Array.from(gate.querySelectorAll('button, a[href]'));
    const first = focusable[0], lastItem = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastItem.focus(); }
    else if (!e.shiftKey && document.activeElement === lastItem) { e.preventDefault(); first.focus(); }
  });
}

// Close the gate. The page lifts `inert` from whatever it marked.
export function closeGate(gate) {
  document.body.classList.remove('gated');
  gate.classList.add('closed');
}
