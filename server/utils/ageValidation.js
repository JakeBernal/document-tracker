const MINIMUM_CITIZEN_AGE = 18;

const parseDateParts = (value) => {
  const rawValue = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return null;
  }

  const [year, month, day] = rawValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isRealDate) {
    return null;
  }

  return { year, month, day, rawValue };
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getLatestAllowedBirthDate = (minimumAge = MINIMUM_CITIZEN_AGE) => {
  const today = new Date();
  const latestAllowedDate = new Date(
    today.getFullYear() - minimumAge,
    today.getMonth(),
    today.getDate()
  );

  return formatDate(latestAllowedDate);
};

const getAge = (dateOfBirth) => {
  const parsedDate = parseDateParts(dateOfBirth);

  if (!parsedDate) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - parsedDate.year;

  const birthdayAlreadyPassed =
    today.getMonth() + 1 > parsedDate.month ||
    (today.getMonth() + 1 === parsedDate.month &&
      today.getDate() >= parsedDate.day);

  if (!birthdayAlreadyPassed) {
    age -= 1;
  }

  return age;
};

const isValidBirthDate = (dateOfBirth) => {
  const parsedDate = parseDateParts(dateOfBirth);

  if (!parsedDate) {
    return false;
  }

  const today = new Date();
  const birthDate = new Date(
    parsedDate.year,
    parsedDate.month - 1,
    parsedDate.day
  );

  return birthDate <= today;
};

const isAtLeastAge = (dateOfBirth, minimumAge = MINIMUM_CITIZEN_AGE) => {
  const age = getAge(dateOfBirth);

  if (age === null) {
    return false;
  }

  return age >= minimumAge;
};

module.exports = {
  MINIMUM_CITIZEN_AGE,
  getAge,
  getLatestAllowedBirthDate,
  isAtLeastAge,
  isValidBirthDate,
};
