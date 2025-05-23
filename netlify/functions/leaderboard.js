const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = 'leaderboard';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async function(event, context) {
  if (event.httpMethod === 'GET') {
    // Fetch leaderboard
    const { data, error } = await supabase
      .from(TABLE)
      .select('name,score,date')
      .order('score', { ascending: false })
      .limit(50);
    if (error) {
      return {
        statusCode: 500,
        body: error.message,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    };
  } else if (event.httpMethod === 'POST') {
    try {
      const { name, score } = JSON.parse(event.body);
      if (!name || typeof score !== 'number') {
        return { statusCode: 400, body: 'Invalid data' };
      }
      const { error } = await supabase
        .from(TABLE)
        .insert([{ name, score, date: new Date().toISOString() }]);
      if (error) {
        return {
          statusCode: 500,
          body: error.message,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      };
    } catch (e) {
      return { statusCode: 500, body: e.message };
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // CORS preflight
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: '',
    };
  } else {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
}; 