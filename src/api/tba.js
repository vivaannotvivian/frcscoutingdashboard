// src/api/tba.js
const EDGE_URL = "https://fufgcqfhjjocrlpkivhi.supabase.co/functions/v1/statbotics-proxy";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1ZmdjcWZoampvY3JscGtpdmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNzQyMjQsImV4cCI6MjA4NDk1MDIyNH0.wvhklFaLw7lHF57UNfr-PWYEWLULiP8iHmKbm0RWD8k"
/**
 * Fetch matches for a team at an event via edge function
 */
export const getTeamEventMatches = async (teamKey, eventKey) => {
  try {
    const body = { type: "teamEventMatches", teamKey, eventKey };
    console.log("Sending request:", body);  // ✅ Fixed: moved before fetch
    
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}` 
       },
      body: JSON.stringify(body)
    });
    
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      return [];
    }
    
    const data = await res.json();
    console.log("Received data:", data);
    return data;
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
};

/**
 * Fetch team info via edge function
 */
export const getTeamInfo = async (teamKey) => {
  try {
    const body = { type: "teamInfo", teamKey };
    console.log("Sending request:", body);
    
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      return null;
    }
    
    const data = await res.json();
    console.log("Received data:", data);
    return data;
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
};

/**
 * The frontend can't know if the key is configured, so just return true
 * or you could remove this entirely
 */
export const isTbaConfigured = () => true;