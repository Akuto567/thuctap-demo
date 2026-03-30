import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./TutorialViewer.module.css";

export interface TutorialImage {
  src: string;
  alt?: string;
}

export interface TutorialViewerProps {
  /** Whether the viewer is visible */
  isOpen: boolean;
  /** Callback when closing the viewer */
  onClose: () => void;
  /**
   * List of tutorial images.
   * If not provided, will auto-load tutorial-N.png files
   */
  images?: TutorialImage[];
  /**
   * Base path for auto-loaded images.
   * Default: "images/"
   */
  basePath?: string;
  /**
   * Base filename pattern.
   * Default: "tutorial" (will load tutorial-1.png, tutorial-2.png, etc.)
   */
  filenamePattern?: string;
  /**
   * File extension for auto-loaded images.
   * Default: "png"
   */
  fileExtension?: string;
  /**
   * Starting index for auto-loaded images (1-based).
   * Default: 1
   */
  startIndex?: number;
}

interface AutoLoadedImage extends TutorialImage {
  index: number;
}

export function TutorialViewer({
  isOpen,
  onClose,
  images,
  basePath = "images/",
  filenamePattern = "tutorial",
  fileExtension = "png",
  startIndex = 1,
}: TutorialViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoLoadedImages, setAutoLoadedImages] = useState<AutoLoadedImage[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  // const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Use provided images or auto-load tutorial-N.png files
  const tutorialImages: TutorialImage[] = images || autoLoadedImages;
  const totalImages = tutorialImages.length;
  const isFirstImage = currentIndex === 0;
  const isLastImage = currentIndex === totalImages - 1;

  // Auto-load images when viewer opens or config changes
  useEffect(() => {
    if (!images && isOpen) {
      setIsLoading(true);
      const loaded: AutoLoadedImage[] = [];
      let index = startIndex;

      const loadImage = (currentIndex: number): Promise<void> => {
        return new Promise((resolve) => {
          const img = new Image();
          const src = `${basePath}${filenamePattern}-${currentIndex}.${fileExtension}`;

          img.onload = () => {
            loaded.push({ src, index: currentIndex });
            resolve();
          };

          img.onerror = () => {
            resolve(); // Stop loading
          };

          img.src = src;
        });
      };

      const loadAllImages = async () => {
        loaded.length = 0;
        index = startIndex;

        while (true) {
          const prevLength = loaded.length;
          await loadImage(index);

          // If no new image was loaded, stop
          if (loaded.length === prevLength) {
            break;
          }

          index++;

          // Safety limit to prevent infinite loops
          if (index > startIndex + 100) {
            break;
          }
        }

        setAutoLoadedImages(loaded);
        setIsLoading(false);
        // setHasLoadedOnce(true);
        setCurrentIndex(0);
      };

      loadAllImages();
    }
  }, [images, isOpen, basePath, filenamePattern, fileExtension, startIndex]);

  const goToNext = useCallback(() => {
    if (isLastImage) {
      onClose();
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, totalImages - 1));
    }
  }, [isLastImage, totalImages, onClose]);

  const goToPrev = useCallback(() => {
    if (!isFirstImage) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  }, [isFirstImage]);

  // Handle dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // Reset to first image when opening
      setCurrentIndex(0);
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle click on backdrop
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      // Check if click is on the dialog backdrop (not on the modal content)
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  // Don't render anything if not open
  if (!isOpen) {
    return null;
  }

  // Show loading state while loading auto images
  if (!images && isLoading) {
    return (
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClick={handleDialogClick}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <div className={styles.modal} ref={modalRef}>
          <div className={styles.header}>
            <h2 className={styles.title}>Tutorial</h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className={styles.loading}>Loading...</div>
        </div>
      </dialog>
    );
  }

  // Show no images state
  if (totalImages === 0) {
    return (
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClick={handleDialogClick}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <div className={styles.modal} ref={modalRef}>
          <div className={styles.header}>
            <h2 className={styles.title}>Tutorial</h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className={styles.noImages}>
            <p>No tutorial images available.</p>
          </div>
        </div>
      </dialog>
    );
  }

  const currentImage = tutorialImages[currentIndex];

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleDialogClick}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tutorial</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.imageContainer}>
          {currentImage && (
            <img
              src={currentImage.src}
              alt={currentImage.alt || `Tutorial step ${currentIndex + 1}`}
              className={styles.image}
            />
          )}
        </div>

        <div className={styles.stepperContainer}>
          <div className={styles.stepper}>
            {tutorialImages.map((_, index) => (
              <div
                key={index}
                className={`${styles.step} ${index === currentIndex ? styles.activeStep : ""}`}
              />
            ))}
          </div>
          <span className={styles.pageIndicator}>
            {currentIndex + 1} / {totalImages}
          </span>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlsLeft}>
            {!isFirstImage && (
              <button className={styles.navButton} onClick={goToPrev}>
                ← Back
              </button>
            )}
          </div>
          <div className={styles.controlsRight}>
            <button className={styles.navButton} onClick={goToNext}>
              {isLastImage ? "Done" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
