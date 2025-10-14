var {toLocaleISOString} = require('./utils');

function fillMissingDays(data) {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 14); // last 15 days inclusive

  // Convert result into a map for fast lookup
  const map = new Map(data.map(d => [d.date, d.done_count]));

  const filled = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = toLocaleISOString(d).split('T')[0];
    filled.push({
      date: dateStr,
      done_count: map.get(dateStr) || 0
    });
  }

  return filled;
}

module.exports = {
    fillMissingDays,
    default: {
        fillMissingDays
    }
};