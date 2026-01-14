const parseString = (genre) => {
  const isString = typeof genre === "string";
  if (!isString) return;
  const isGenre = (genre) =>
    ["fantastic", "love", "detective", "history"].includes(genre);

  if (isGenre(genre)) return genre;
};

const parseNumber = (number) => {
  const isString = typeof number === "string";
  if (!isString) return;
  const parsedNumber = parseInt(number);
  if (Number.isNaN(parsedNumber)) return;
  return parsedNumber;
};

const parseFilterParams = (query) => {
  const { genre, maxRating, minRating } = query;

  const parsedGenre = parseString(genre);
  const parsedMaxRating = parseNumber(maxRating);
  const parsedMinRating = parseNumber(minRating);

  return {
    genre: parsedGenre,
    maxRating: parsedMaxRating,
    minRating: parsedMinRating,
  };
};

export default parseFilterParams;
