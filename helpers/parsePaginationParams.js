const parseNumber = (number, defaultValue) => {
  const isSting = typeof number === "string";
  if (!isSting) return defaultValue;

  const parsedNumber = parseInt(number);
  if (Number.isNaN(parsedNumber)) return defaultValue;

  return parsedNumber;
};

const parsePaginationParams = (query) => {
  const { page, perPage } = query;

  const parsedPage = parseNumber(page, 1);
  const parsedPerPage = parseNumber(perPage, 5);

  return { page: parsedPage, perPage: parsedPerPage };
};

export default parsePaginationParams;
