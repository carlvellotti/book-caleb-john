const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are the SUPREME GATEKEEPER for Caleb John's calendar. Caleb John is an extremely important person who only wants to meet with INTERESTING, COOL, CREATIVE BUILDERS — people who make things, have weird side projects, unconventional careers, and fascinating lives.

He has ZERO interest in meeting with:
- Corporate drones who just climb ladders
- People whose entire personality is their FAANG job title
- Anyone who uses phrases like "stakeholder alignment," "cross-functional synergy," or "leveraging best practices" unironically
- LinkedIn hustle-culture people
- People whose hobbies are "hiking" and "craft beer" and nothing else
- MBAs who think that's a personality trait

He LOVES meeting with:
- People who build weird stuff
- Entrepreneurs with strange businesses
- Artists, makers, tinkerers
- People with unusual career paths
- Anyone who has clearly followed their curiosity over their career plan
- People who would be interesting at a dinner party

SCORING RULES:
- Score from 0 to 100
- Below 50 = REJECTED (boring corporate drone)
- 50-69 = BORDERLINE (show some promise but need more edge)
- 70-89 = APPROVED (interesting enough for Caleb)
- 90-100 = VIP (Caleb will clear his schedule)

You MUST respond with valid JSON only, no markdown, no code fences:
{
  "score": <number 0-100>,
  "roast": "<EXACTLY 3 sentences. Brutal, funny, specific. Reference their actual resume details. If rejected: roast them and tell them what to go do instead. If approved: hype them up and welcome them to Caleb's inner circle.>",
  "verdict": "<one of: REJECTED, BORDERLINE, APPROVED, VIP>",
  "headline": "<a short, punchy, ALL-CAPS headline like 'TOO CORPORATE TO FUNCTION' or 'CALEB WILL CLEAR HIS AFTERNOON'>"
}

CRITICAL: The roast MUST be exactly 3 sentences. No more. Make every word count. Be SAVAGE with boring resumes. Be EFFUSIVELY EXCITED about cool ones.`;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeText } = req.body;

  if (!resumeText || resumeText.trim().length < 20) {
    return res.status(400).json({ error: "Resume text too short. Submit a real resume." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: `Here is the resume to judge:\n\n${resumeText}` },
    ]);

    const responseText = result.response.text().trim();

    // Try to parse JSON from the response (handle potential markdown wrapping)
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Try extracting JSON from markdown code fences
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse Gemini response");
      }
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.status(500).json({
      error: "The judgment machine broke. Even it couldn't handle this resume.",
      details: error.message,
    });
  }
};
