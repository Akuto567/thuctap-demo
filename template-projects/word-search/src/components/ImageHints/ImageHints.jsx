export default function ImageHints({ items, foundWords }) {
  const isImagePath = (str) => {
    return str && (str.includes("/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(str));
  };

  const getWordSizeClass = (word = "") => {
    const length = word.trim().length;

    if (length >= 10) {
      return "hint-word hint-word--small";
    }

    if (length >= 7) {
      return "hint-word hint-word--medium";
    }

    return "hint-word";
  };

  return (
    <div className="image-hints">
      {items.map((item) => (
        <div
          key={item.id}
          className={`hint ${foundWords?.includes(item.keyword.toUpperCase()) ? "found-hint" : ""}`}
        >
          {isImagePath(item.image) ? (
            <img src={item.image} alt={item.keyword} />
          ) : (
            <div className="hint-emoji">
              {item.image}
            </div>
          )}
          <p
            className={`${getWordSizeClass(item.keyword)} ${
              foundWords?.includes(item.keyword.toUpperCase()) ? "" : "hidden-word"
            }`.trim()}
          >
            {item.keyword}
          </p>
        </div>
      ))}
    </div>
  );
}
