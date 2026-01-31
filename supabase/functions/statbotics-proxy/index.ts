import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const TBA_API_KEY = Deno.env.get("TBA_API_KEY");

serve(async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // allow your frontend origin if you want stricter
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    // ✅ Preflight response must return 204 status and CORS headers
    return new Response(null, { status: 204, headers });
  }

  try {
    const { type, teamKey, eventKey } = await req.json();

    if (!TBA_API_KEY) {
      return new Response(JSON.stringify({ error: "TBA API key not configured" }), {
        status: 500,
        headers,
      });
    }

    if (!type || !teamKey || (type === "teamEventMatches" && !eventKey)) {
      return new Response(JSON.stringify({ error: "Missing type, teamKey, or eventKey" }), {
        status: 400,
        headers,
      });
    }

    let url: string;
    if (type === "teamEventMatches") {
      url = `https://www.thebluealliance.com/api/v3/team/${teamKey}/event/${eventKey}/matches`;
    } else if (type === "teamInfo") {
      url = `https://www.thebluealliance.com/api/v3/team/${teamKey}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers });
    }

    const res = await fetch(url, {
      headers: { "X-TBA-Auth-Key": TBA_API_KEY },
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("TBA Proxy Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
});
