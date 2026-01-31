import axios from 'axios';

const BASE_URL = 'https://api.statbotics.io/v3';

/**
 * Fetches team statistics for a specific event.
 * @param {string} eventKey - The event key (e.g., "2024tur").
 * @returns {Promise<Array>} - List of team stats for the event.
 */
export const getEventTeamStats = async (eventKey) => {
    try {
        const response = await axios.get(`${BASE_URL}/team_events`, {
            params: {
                event: eventKey,
                limit: 1000 // Get all teams
            }
        });

        // Normalize data structure for the app
        return response.data.map(item => ({
            team: item.team,
            // Statbotics v3 structure is nested
            epa_total: item.epa?.breakdown?.total_points || item.epa?.total_points?.mean,
            epa_auto: item.epa?.breakdown?.auto_points,
            epa_teleop: item.epa?.breakdown?.teleop_points,
            epa_endgame: item.epa?.breakdown?.endgame_points
        }));
    } catch (error) {
        console.error(`Error fetching Statbotics data for event ${eventKey}:`, error);
        throw error;
    }
};

/**
 * Fetches a single team's stats.
 * Uses /v3/team/{team} endpoint.
 * @param {number} teamNumber 
 * @returns {Promise<Object>}
 */
export const getTeamStats = async (teamNumber) => {
    try {
        // Correct endpoint is singular 'team'
        const response = await axios.get(`${BASE_URL}/team/${teamNumber}`);
        const data = response.data;

        return {
            team: data.team,
            // Map available data
            epa_total: data.norm_epa?.current,
            epa_auto: null, // Not available in basic team endpoint
            epa_teleop: null,
            epa_endgame: null
        };
    } catch (error) {
        console.error(`Error fetching Statbotics data for team ${teamNumber}:`, error);
        throw error; // Let caller handle
    }
};
