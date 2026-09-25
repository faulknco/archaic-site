// The photosensitivity gate shared by the Forge pieces. Lifted out of
// /forge/spin: each piece passes its own sessionStorage key, so accepting the
// notice on one piece covers only that piece for the browser session (a mild
// notice must never clear a flashing one); and a Tab wrap so keyboard focus
// stays inside the gate while it is open.
//
// Everything behind the gate is expected to be `inert` already (the page owns
// that, because what is behind the gate differs from piece to piece); this
// module only handles the gate itself.
export const GATE_KEY = 'spin-gate'; // Spin's key; other pieces pass their own

// Whether the visitor has already accepted the notice in this session.
// sessionStorage can throw (private windows, storage disabled); a throw means
// "not seen", never a broken page.
export function gateSeen(key = GATE_KEY) {
  try { return sessionStorage.getItem(key) === 'ok'; } catch { return false; }
}

// Wire Continue and the focus trap. Call this before any other work in the
// page module: anything that throws further down then costs the reader that
// feature, not the page — the alternative is a reader trapped behind a warning
// they cannot dismiss. `onStart` runs when Continue is pressed.
export function wireGate({ gate, begin, onStart, key = GATE_KEY }) {
  begin.addEventListener('click', () => {
    try { sessionStorage.setItem(key, 'ok'); } catch {}
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
