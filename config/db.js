const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const env = require('./env');

let pool = null;
let isFallbackMode = false;

// Fallback in-memory/JSON store if MySQL daemon is not running
const fallbackDbPath = path.join(__dirname, '..', 'data', 'fallback_db.json');
let fallbackStore = {
  users: [],
  courses: [],
  course_schedule: [],
  course_files: [],
  timetable_entries: [],
  ai_conversations: [],
  notifications: [],
  study_sessions: [],
  user_gamification: [],
  _autoIncrements: {
    users: 1,
    courses: 1,
    course_schedule: 1,
    course_files: 1,
    timetable_entries: 1,
    ai_conversations: 1,
    notifications: 1,
    study_sessions: 1
  }
};

function ensureDataDir() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadFallbackStore() {
  try {
    ensureDataDir();
    if (fs.existsSync(fallbackDbPath)) {
      const data = fs.readFileSync(fallbackDbPath, 'utf8');
      fallbackStore = JSON.parse(data);
    }
  } catch (err) {
    console.error('[DB] Error loading fallback store:', err.message);
  }
}

function saveFallbackStore() {
  try {
    ensureDataDir();
    fs.writeFileSync(fallbackDbPath, JSON.stringify(fallbackStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving fallback store:', err.message);
  }
}

async function initMySQL() {
  try {
    // Connect with multipleStatements enabled to run schema migrations
    const connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      multipleStatements: true
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.database}\`;`);
    await connection.query(`USE \`${env.db.database}\`;`);

    // Run schema migrations
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
    }

    await connection.end();

    // Create connection pool for the database
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    console.log(`[DB] Successfully connected to MySQL database: ${env.db.database} on ${env.db.host}:${env.db.port}`);
    return true;
  } catch (error) {
    console.warn(`[DB] MySQL connection failed (${error.message}). Activating robust local persistent storage fallback.`);
    isFallbackMode = true;
    loadFallbackStore();
    return false;
  }
}

// Universal query runner supporting MySQL and standard queries
async function query(sql, params = []) {
  if (!isFallbackMode && pool) {
    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.warn('[DB] Lost connection to MySQL, switching to local store fallback.');
        isFallbackMode = true;
        loadFallbackStore();
      } else {
        throw err;
      }
    }
  }

  // Fallback SQL execution engine for zero-config offline runs
  return executeFallbackQuery(sql, params);
}

function executeFallbackQuery(sql, params) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  const upper = cleanSql.toUpperCase();

  // Handle INSERT
  if (upper.startsWith('INSERT INTO')) {
    const tableMatch = cleanSql.match(/INSERT\s+INTO\s+`?([a-zA-Z0-9_]+)`?\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i) ||
                       cleanSql.match(/INSERT\s+INTO\s+`?([a-zA-Z0-9_]+)`?\s+SET/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      if (!fallbackStore[tableName]) fallbackStore[tableName] = [];
      const columns = tableMatch[2].split(',').map(c => c.trim().replace(/[`]/g, ''));
      
      const newId = fallbackStore._autoIncrements[tableName] || (fallbackStore[tableName].length + 1);
      fallbackStore._autoIncrements[tableName] = newId + 1;

      const newRecord = { id: newId, created_at: new Date().toISOString() };
      columns.forEach((col, idx) => {
        newRecord[col] = params[idx] !== undefined ? params[idx] : null;
      });

      fallbackStore[tableName].push(newRecord);
      saveFallbackStore();
      return { insertId: newId, affectedRows: 1 };
    }
  }

  // Handle UPDATE
  if (upper.startsWith('UPDATE')) {
    const tableMatch = cleanSql.match(/UPDATE\s+`?([a-zA-Z0-9_]+)`?\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      const setClause = tableMatch[2];
      const whereClause = tableMatch[3];
      const table = fallbackStore[tableName] || [];

      // Extract where condition (e.g. id = ? AND user_id = ?)
      let affected = 0;
      const setFields = setClause.split(',').map(s => s.trim().split('=')[0].trim().replace(/[`]/g, ''));
      const numSetFields = setFields.length;
      const setValues = params.slice(0, numSetFields);
      const whereValues = params.slice(numSetFields);

      table.forEach(row => {
        let match = true;
        if (whereClause.includes('id =') && whereValues.length > 0) {
          if (row.id != whereValues[0]) match = false;
        }
        if (match && whereClause.includes('user_id =') && whereValues.length > 1) {
          if (row.user_id != whereValues[1]) match = false;
        }
        if (match) {
          setFields.forEach((field, i) => {
            row[field] = setValues[i];
          });
          affected++;
        }
      });

      saveFallbackStore();
      return { affectedRows: affected };
    }
  }

  // Handle DELETE
  if (upper.startsWith('DELETE FROM')) {
    const tableMatch = cleanSql.match(/DELETE\s+FROM\s+`?([a-zA-Z0-9_]+)`?\s+WHERE\s+(.+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      const whereClause = tableMatch[2];
      const initialLen = (fallbackStore[tableName] || []).length;

      if (whereClause.includes('id =') && params.length >= 1) {
        const targetId = params[0];
        fallbackStore[tableName] = (fallbackStore[tableName] || []).filter(r => r.id != targetId);
      } else if (whereClause.includes('user_id =') && params.length >= 1) {
        const targetUserId = params[0];
        fallbackStore[tableName] = (fallbackStore[tableName] || []).filter(r => r.user_id != targetUserId);
      } else if (whereClause.includes('course_id =') && params.length >= 1) {
        const targetCourseId = params[0];
        fallbackStore[tableName] = (fallbackStore[tableName] || []).filter(r => r.course_id != targetCourseId);
      }

      saveFallbackStore();
      const removed = initialLen - (fallbackStore[tableName] || []).length;
      return { affectedRows: removed };
    }
  }

  // Handle SELECT
  if (upper.startsWith('SELECT')) {
    // Determine main table
    const fromMatch = cleanSql.match(/FROM\s+`?([a-zA-Z0-9_]+)`?/i);
    if (!fromMatch) return [];
    const tableName = fromMatch[1];
    let rows = JSON.parse(JSON.stringify(fallbackStore[tableName] || []));

    // Handle joins or basic filters
    if (upper.includes('WHERE')) {
      if (cleanSql.includes('email =') && params.length >= 1) {
        rows = rows.filter(r => r.email && r.email.toLowerCase() === String(params[0]).toLowerCase());
      }
      if (cleanSql.includes('user_id =')) {
        const uId = params.find((_, i) => cleanSql.split('?')[i] && cleanSql.split('?')[i].includes('user_id ='));
        const targetUId = uId !== undefined ? uId : params[0];
        rows = rows.filter(r => r.user_id == targetUId);
      }
      if (cleanSql.includes('course_id =')) {
        const cId = params[0];
        rows = rows.filter(r => r.course_id == cId);
      }
      if (cleanSql.includes('courses.id =') || (cleanSql.includes('id =') && !cleanSql.includes('user_id ='))) {
        const targetId = params[0];
        rows = rows.filter(r => r.id == targetId);
      }
    }

    // Attach relational sub-items if requested (e.g. course schedules, files)
    if (tableName === 'courses') {
      rows.forEach(course => {
        course.schedules = (fallbackStore.course_schedule || []).filter(s => s.course_id == course.id);
        course.files = (fallbackStore.course_files || []).filter(f => f.course_id == course.id);
      });
    }

    return rows;
  }

  return [];
}

module.exports = {
  initMySQL,
  query,
  isFallback: () => isFallbackMode
};
