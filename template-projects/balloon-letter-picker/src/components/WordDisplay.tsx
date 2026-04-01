// src/components/WordDisplay.tsx
import React, { useEffect, useState } from 'react';
import type { WordData } from '../types/game.types';

interface WordDisplayProps {
  currentWord: WordData;
  currentProgress: string[];
  score: number;
  level: number;
  totalWords: number;
}

const WordDisplay: React.FC<WordDisplayProps> = ({ 
  currentWord,
  currentProgress,
  score,
  level,
  totalWords
}) => {
  const [wordImage, setWordImage] = useState<HTMLImageElement | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = currentWord.imageUrl;
    img.onload = () => setWordImage(img);
  }, [currentWord]);

  const wordProgress = (currentProgress.filter(l => l !== '_').length / currentWord.word.length) * 100;
  
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  
  // Kích thước nhỏ hơn
  const containerPadding = isMobile ? '8px 12px' : '10px 16px';
  const imageSize = isMobile ? 85 : isTablet ? 100 : 120;
  const letterBoxSize = isMobile ? 32 : isTablet ? 38 : 42;
  const letterFontSize = isMobile ? 18 : isTablet ? 22 : 26;
  const hintFontSize = isMobile ? 15 : isTablet ? 17 : 18;
  const hintPadding = isMobile ? '8px 18px' : '9px 22px';
  const gap = isMobile ? 10 : 12;
  const flexDirection = isMobile ? 'column' : 'row';
  const scoreFontSize = isMobile ? 12 : 14;
  const levelFontSize = isMobile ? 10 : 11;

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      backdropFilter: 'blur(8px)',
      padding: containerPadding,
      borderRadius: '16px',
      marginBottom: '0',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      border: '1px solid rgba(255,255,255,0.3)'
    }}>
      {/* Thanh tiến trình và điểm */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: 1,
          height: '3px',
          background: 'rgba(224, 224, 224, 0.8)',
          borderRadius: '2px',
          overflow: 'hidden',
          minWidth: '60px'
        }}>
          <div style={{
            width: `${wordProgress}%`,
            height: '100%',
            background: '#667eea',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        <div style={{
          fontSize: `${scoreFontSize}px`,
          fontWeight: '600',
          color: '#764ba2',
          background: 'rgba(243, 232, 255, 0.9)',
          padding: isMobile ? '2px 8px' : '2px 10px',
          borderRadius: '20px',
          whiteSpace: 'nowrap'
        }}>
          {score}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: `${gap}px`,
        alignItems: 'center',
        flexDirection: flexDirection
      }}>
        {/* Hình ảnh nhỏ hơn */}
        <div style={{
          width: `${imageSize}px`,
          height: `${imageSize}px`,
          border: '2px solid rgba(102, 126, 234, 0.6)',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: 'rgba(245, 245, 245, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          margin: isMobile ? '0 auto' : '0'
        }}>
          {wordImage ? (
            <img 
              src={wordImage.src} 
              alt="illustration"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{ color: '#999', fontSize: `${letterFontSize - 6}px` }}>📷</div>
          )}
        </div>

        {/* Khu vực ô chữ */}
        <div style={{ 
          flex: 1,
          minWidth: 0,
          width: '100%'
        }}>
          {/* Hàng ô chữ */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '4px' : '6px',
            justifyContent: 'center',
            marginBottom: isMobile ? '6px' : '8px',
            flexWrap: 'wrap'
          }}>
            {currentProgress.map((letter, index) => (
              <div key={index} style={{
                width: `${letterBoxSize}px`,
                height: `${letterBoxSize}px`,
                border: '2px solid rgba(102, 126, 234, 0.6)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${letterFontSize}px`,
                fontWeight: 'bold',
                backgroundColor: letter !== '_' ? 'rgba(240, 247, 255, 0.9)' : 'rgba(250, 250, 250, 0.7)',
                color: '#333',
                transition: 'all 0.2s ease',
                boxShadow: letter !== '_' ? '0 1px 4px rgba(102, 126, 234, 0.2)' : 'none'
              }}>
                {letter}
              </div>
            ))}
          </div>
          
          {/* Hint nhỏ hơn */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '0 3px'
          }}>
            <span style={{
              fontSize: `${hintFontSize}px`,
              color: '#2c3e50',
              fontWeight: '500',
              fontStyle: 'italic',
              background: 'rgba(240, 247, 255, 0.9)',
              padding: hintPadding,
              borderRadius: '30px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              border: '1px solid rgba(224, 231, 255, 0.8)',
              textAlign: 'center',
              wordBreak: 'break-word'
            }}>
              {currentWord.hint}
            </span>
          </div>
          
          {/* Level nhỏ hơn */}
          <div style={{
            textAlign: 'center',
            marginTop: '4px',
            fontSize: `${levelFontSize}px`,
            color: 'rgba(136, 136, 136, 0.9)'
          }}>
            Level {level}/{totalWords}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordDisplay;