function addDays(date, days) {
  date.setDate(date.getDate() + days);
  return date;
}

function getRangeOfDates(startDate, stopDate) {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= stopDate) {
    dateArray.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  return dateArray;
}

function getDatesUntilNextYear(days) {
  var d = new Date();
  var year_i = d.getFullYear();

  var days = days.split(",");
  days = days.map(Number);

  dates_to_push = [];

  // Get all the days of the current year that are in the array "days"
  while (d.getFullYear() === year_i) {
    var wd = d.getDay();
    if (days.includes(wd)) {
      var pushDate = new Date(d.getTime());
      dates_to_push.push(pushDate);
    }
    d.setDate(d.getDate() + 1);
  }

  return dates_to_push;
}

// months: string like "0,2,5,11"
function getMonthlyDates(months) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const selectedMonths = months
    .split(",")
    .map((m) => parseInt(m.trim()))
    .filter((m) => !isNaN(m) && m >= 0 && m <= 11);

  const dates = [];

  // Create one date per selected month from now until the end of this year
  for (let y of [currentYear]) {
    for (let m of selectedMonths) {
      const date = new Date(y, m, 1); // pick day 1 of that month
      if (date >= now) {
        dates.push(date);
      }
    }
  }

  return dates;
}

function nextDate(dayIndex) {
  const today = new Date();
  const todayDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...

  const result = new Date(today);

  if (todayDay === dayIndex) {
    // If today is the target day (e.g., Sunday), return today
    result.setHours(23, 59, 59);
    return result;
  }

  // Otherwise, calculate next target day
  const diff = (dayIndex - todayDay + 7) % 7;
  result.setDate(result.getDate() + diff);
  result.setHours(23, 59, 59);

  return result;
}

function previousMonday() {
  var d = new Date();
  d.setDate(d.getDate() + 1 - (d.getDay() || 7));
  d.setHours(0, 0, 0);
  return d;
}

function toLocaleISOString(date) {
  function pad(number) {
    if (number < 10) {
      return "0" + number;
    }
    return number;
  }

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

function getRangeOfMonths(startDate, endDate) {
  const months = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

function toCron(days, time) {
  // parse time string
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // join days array into comma-separated string
  const dayOfWeek = days;

  // build cron string
  return `${minute} ${hour} * * ${dayOfWeek}`;
}

module.exports = {
  addDays,
  getRangeOfDates,
  getDatesUntilNextYear,
  getMonthlyDates,
  nextDate,
  previousMonday,
  toLocaleISOString,
  getRangeOfMonths,
  toCron,
  default: {
    addDays,
    getRangeOfDates,
    getDatesUntilNextYear,
    getMonthlyDates,
    nextDate,
    previousMonday,
    toLocaleISOString,
    getRangeOfMonths,
    toCron,
  },
};
