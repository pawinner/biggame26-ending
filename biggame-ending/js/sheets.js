// Google Sheets Integration (Placeholder)
// When you publish a Google Sheet to the web, you can copy the CSV export URL:
// e.g., https://docs.google.com/spreadsheets/d/e/2PACX-xxxx/pub?output=csv
const GOOGLE_SHEETS_CSV_URL = "";

// Mock data to use when GOOGLE_SHEETS_CSV_URL is empty
const mockTeamsData = [
  { rank: 1, name: "บ้าน A (House A)", score: 980 },
  { rank: 2, name: "บ้าน B (House B)", score: 945 },
  { rank: 3, name: "บ้าน C (House C)", score: 910 },
  { rank: 4, name: "บ้าน D (House D)", score: 850 },
  { rank: 5, name: "บ้าน E (House E)", score: 820 },
  { rank: 6, name: "บ้าน F (House F)", score: 790 },
  { rank: 7, name: "บ้าน G (House G)", score: 760 },
  { rank: 8, name: "บ้าน H (House H)", score: 730 },
  { rank: 9, name: "บ้าน I (House I)", score: 700 },
  { rank: 10, name: "บ้าน J (House J)", score: 680 },
  { rank: 11, name: "บ้าน K (House K)", score: 650 },
  { rank: 12, name: "บ้าน L (House L)", score: 600 }
];

export async function fetchLeaderboardData() {
  if (!GOOGLE_SHEETS_CSV_URL) {
    console.log("No Google Sheet CSV URL set. Loading mock team data.");
    return mockTeamsData;
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_CSV_URL);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const csvText = await response.text();
    return parseCsvData(csvText);
  } catch (error) {
    console.error("Failed to fetch Google Sheets data:", error);
    return mockTeamsData; // Fallback to mock data if fetch fails
  }
}

// Simple CSV Parser
function parseCsvData(csvText) {
  const lines = csvText.split(/\r?\n/);
  const results = [];
  
  // Skip header line (e.g. Rank, House Name, Score)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split values, handling commas
    const columns = line.split(',');
    if (columns.length >= 3) {
      results.push({
        rank: parseInt(columns[0]) || i,
        name: columns[1].replace(/^"|"$/g, ''), // remove quotes
        score: parseInt(columns[2]) || 0
      });
    }
  }
  
  // Sort by rank ascending
  return results.sort((a, b) => a.rank - b.rank);
}
