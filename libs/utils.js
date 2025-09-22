function addDays(date, days) {
    date.setDate(date.getDate() + days);
    return date;
}

function getRangeOfDates(startDate, stopDate) {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= stopDate) {
      dateArray.push(new Date (currentDate));
      currentDate = currentDate.addDays(1);
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

function nextDate(dayIndex) {
  var today = new Date();
  today.setDate(today.getDate() + (dayIndex - 1 - today.getDay() + 7) % 7 + 1);
  today.setHours(23, 59, 59);
  return today;
}

function previousMonday() {
  var d = new Date();
  d.setDate(d.getDate() + 1 - (d.getDay() || 7));
  d.setHours(0, 0, 0);
  return d;
}

module.exports = {
    addDays,
    getRangeOfDates,
    getDatesUntilNextYear,
    nextDate,
    previousMonday,
    default: {
        addDays,
        getRangeOfDates,
        getDatesUntilNextYear,
        nextDate,
        previousMonday
    }
};
