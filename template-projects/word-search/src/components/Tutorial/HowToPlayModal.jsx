import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/tutorial-modal.css";

export default function HowToPlayModal({ isOpen, onClose, images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    setCurrentIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || images.length === 0) {
    return null;
  }

  const isFirstImage = currentIndex === 0;
  const isLastImage = currentIndex === images.length - 1;
  const currentImage = images[currentIndex];

  const handleNext = () => {
    if (isLastImage) {
      onClose();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (isFirstImage) {
      return;
    }

    setCurrentIndex((prev) => prev - 1);
  };

  return createPortal(
    <div className="tutorial-modal-overlay" onClick={onClose}>
      <div
        className="tutorial-modal"
        role="dialog"
        aria-modal="true"
        aria-label="How to Play"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tutorial-modal__header">
          <h2 className="tutorial-modal__title">How to Play</h2>
          <button
            type="button"
            className="tutorial-modal__close"
            onClick={onClose}
            aria-label="Close tutorial"
          >
            x
          </button>
        </div>

        <div className="tutorial-modal__image-area">
          <img
            src={currentImage.src}
            alt={currentImage.alt || `Tutorial step ${currentIndex + 1}`}
            className="tutorial-modal__image"
          />
        </div>

        <div className="tutorial-modal__meta">
          <div className="tutorial-modal__dots" aria-hidden="true">
            {images.map((_, index) => (
              <span
                key={`tutorial-step-${index}`}
                className={`tutorial-modal__dot${index === currentIndex ? " tutorial-modal__dot--active" : ""}`}
              />
            ))}
          </div>
          <span className="tutorial-modal__count">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        <div className="tutorial-modal__actions">
          <div>
            {!isFirstImage && (
              <button
                type="button"
                className="tutorial-modal__button tutorial-modal__button--secondary"
                onClick={handlePrev}
              >
                Back
              </button>
            )}
          </div>
          <button
            type="button"
            className="tutorial-modal__button"
            onClick={handleNext}
          >
            {isLastImage ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
