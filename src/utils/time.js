export function formatDateTime(inputDate) {
  const date = new Date(inputDate);
  const now = new Date();

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const isYesterday = (a, b) => {
    const yesterday = new Date(b);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(a, yesterday);
  };

  const isTomorrow = (a, b) => {
    const tomorrow = new Date(b);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isSameDay(a, tomorrow);
  };

  const weekdayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  let prefix;
  if (isSameDay(date, now)) {
    prefix = 'Today';
  } else if (isYesterday(date, now)) {
    prefix = 'Yesterday';
  } else if (isTomorrow(date, now)) {
    prefix = 'Tomorrow';
  } else {
    const dayName = weekdayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    if (date.getFullYear() === now.getFullYear()) {
      prefix = `${dayName}, ${day} ${month}`;
    } else {
      prefix = `${dayName}, ${day} ${month}, ${date.getFullYear()}`;
    }
  }

  const hours24 = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const ampm = hours24 < 12 ? 'am' : 'pm';

  const timeStr = `${hours12}:${minutes}${minutes === '00' ? '' : ''}${ampm}`;

  return `${prefix}, at ${timeStr}`.toLowerCase();
}

export function getNextTime(times) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  const tomorrow = nextDay.toISOString().split('T')[0];

  const todayTimes = times
    .map(time => new Date(`${today}T${time}:00`))
    .filter(dt => dt > now)
    .sort();
  const tomorrowTimes = times
    .map(time => new Date(`${tomorrow}T${time}:00`))
    .sort();

  if (todayTimes.length == 0) {
    return tomorrowTimes[0];
  } else return todayTimes[0];
}

export function getNextNextTime(times) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  const tomorrow = nextDay.toISOString().split('T')[0];

  const nextNextDay = new Date();
  nextNextDay.setDate(nextNextDay.getDate() + 2);
  const afterTomorrow = nextNextDay.toISOString().split('T')[0];

  const todayTimes = times
    .map(time => new Date(`${today}T${time}:00`))
    .filter(dt => dt > getNextTime(times))
    .sort();
  const tomorrowTimes = times
    .map(time => new Date(`${tomorrow}T${time}:00`))
    .filter(dt => dt > getNextTime(times))
    .sort();
  const afterTomorrowTimes = times
    .map(time => new Date(`${afterTomorrow}T${time}:00`))
    .sort();

  if (todayTimes.length == 0) {
    if (tomorrowTimes.length == 0) {
      return afterTomorrowTimes[0];
    }
    return tomorrowTimes[0];
  }
  return todayTimes[0];
}
