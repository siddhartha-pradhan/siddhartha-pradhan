const calculateUptime = (birthDate) => {
  const now = new Date();

  let years = now.getUTCFullYear() - birthDate.getUTCFullYear();
  let months = now.getUTCMonth() - birthDate.getUTCMonth();
  let days = now.getUTCDate() - birthDate.getUTCDate();

  if (days < 0) {
    const prevMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 0);
    days += prevMonth.getUTCDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days };
};

module.exports = { calculateUptime };
