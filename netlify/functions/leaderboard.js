const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = 'leaderboard';
const DEBUG = process.env.DEBUG === 'true';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function debugLog(...args) {
  if (DEBUG) console.log('[DEBUG]', ...args);
}

exports.handler = async function(event, context) {
  debugLog('Incoming request:', {
    method: event.httpMethod,
    path: event.path,
    body: event.body,
    query: event.queryStringParameters,
  });
  debugLog('Env:', {
    SUPABASE_URL: SUPABASE_URL,
    TABLE: TABLE,
    DEBUG: DEBUG,
    // Do not log SUPABASE_SERVICE_ROLE_KEY
  });

  if (event.httpMethod === 'GET') {
    // Fetch leaderboard
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('name,score,date')
        .order('score', { ascending: false })
        .limit(50);
      debugLog('GET result:', { data, error });
      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message, details: error }),
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      };
    } catch (e) {
      debugLog('GET exception:', e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: e.message, stack: e.stack }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      };
    }
  } else if (event.httpMethod === 'POST') {
    try {
      let parsed;
      try {
        parsed = JSON.parse(event.body);
      } catch (e) {
        debugLog('POST JSON parse error:', e);
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON', details: e.message }) };
      }
      const { name, score } = parsed;
      if (!name || typeof score !== 'number') {
        debugLog('POST validation error:', { name, score });
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid data', details: { name, score } }) };
      }
      const { error } = await supabase
        .from(TABLE)
        .insert([{ name, score, date: new Date().toISOString() }]);
      debugLog('POST insert result:', { error });
      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message, details: error }),
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      };
    } catch (e) {
      debugLog('POST exception:', e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: e.message, stack: e.stack }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      };
    }
  } else if (event.httpMethod === 'OPTIONS') {
    // CORS preflight
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: '',
    };
  } else {
    debugLog('Method not allowed:', event.httpMethod);
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
}; 