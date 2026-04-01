// src/components/Game.tsx
import React, { useEffect, useRef, useState } from 'react';
import WordDisplay from './WordDisplay';
import useGameLogic from '../hooks/useGameLogic';
import { BUBBLE_IMAGES } from '../data/words';
import { SOUNDS } from '../data/sounds';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [globalMousePos, setGlobalMousePos] = useState({ x: 0, y: 0 });
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  
  // State cho hiệu ứng
  const [explodeEffect, setExplodeEffect] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [showCelebration, setShowCelebration] = useState(false);
  const [explodeImage, setExplodeImage] = useState<HTMLImageElement | null>(null);
  const [chippyImage, setChippyImage] = useState<HTMLImageElement | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ text: '', type: 'info', visible: false });
  

  
  // Hàm tính toán responsive
  const getBubbleSize = (width: number, height: number) => {
    const byWidth = width * 0.06;
    const byHeight = height * 0.08;
    const baseSize = Math.min(byWidth, byHeight);
    return Math.max(150, Math.min(200, baseSize));
  };
  
  const getFontSize = (bubbleSize: number) => {
    return Math.floor(bubbleSize * 0.32);
  };
  
  const getHitRadius = (bubbleSize: number) => {
    return Math.floor(bubbleSize * 0.55);
  };
  
  const getBubbleSpeed = (height: number) => {
    return Math.max(1, Math.min(3, height / 200));
  };
  
  const getCrosshairSize = (width: number) => {
    return Math.max(16, Math.min(28, width / 45));
  };
  
  const getLineWidth = (width: number) => {
    return Math.max(1.5, Math.min(3, width / 500));
  };
  
  const bubbleSize = getBubbleSize(canvasSize.width, canvasSize.height);
  const fontSize = getFontSize(bubbleSize);
  const hitRadius = getHitRadius(bubbleSize);
  const bubbleSpeed = getBubbleSpeed(canvasSize.height);
  
  const {
    bubbles,
    currentWord,
    currentProgress,
    score,
    gameOver,
    level,
    totalWords,
    remainingLetters,
    shootBubble,
    resetGame,
    setCallbacks
  } = useGameLogic(canvasSize, bubbleSpeed);
  
  // Hàm hiển thị thông báo
  const showToast = (text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage({ text, type, visible: true });
    setTimeout(() => {
      setToastMessage(prev => ({ ...prev, visible: false }));
    }, 1500);
  };
  
  // Hàm tạo hiệu ứng nổ
  const triggerExplode = (x: number, y: number) => {
    setExplodeEffect({ x, y, active: true });
    setTimeout(() => {
      setExplodeEffect(prev => ({ ...prev, active: false }));
    }, 300);
  };

  const playCompleteSound = () => {
  const audio = new Audio(SOUNDS.complete);
  audio.volume = 0.7;
  
  // Thử phát, nếu lỗi thì dùng beep
  audio.play().catch(() => {
    console.log('MP3 failed, using beep');
    // Beep fallback
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
    oscillator.stop(audioContext.currentTime + 0.3);
    if (audioContext.state === 'suspended') audioContext.resume();
  });
};
  
  // Hàm hiển thị nhân vật chúc mừng
  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };
  
  // Hàm reset game
  const handleResetGame = () => {
    resetGame();
    sounds.pop.pause();
    sounds.pop.currentTime = 0;
    sounds.complete.pause();
    sounds.complete.currentTime = 0;
  };
  const [sounds] = useState(() => {
  const soundFiles = SOUNDS;
  return {
    pop: new Audio(soundFiles.pop),
    complete: new Audio(soundFiles.complete)
  };
});
  
  // Load hình ảnh hiệu ứng
  useEffect(() => {
  const loadEffectImages = async () => {
    const explodeImg = new Image();
    // Sửa đường dẫn: thêm dấu . để tương đối
    explodeImg.src = './images/effects/explode.png';
    explodeImg.onload = () => setExplodeImage(explodeImg);
    explodeImg.onerror = () => {
      console.log('Không tải được explode.png, dùng hình mặc định');
      // Tạo hình mặc định nếu không có
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(50, 50, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'yellow';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('💥', 50, 65);
        const defaultImg = new Image();
        defaultImg.src = canvas.toDataURL();
        setExplodeImage(defaultImg);
      }
    };
    
    const chippyImg = new Image();
    chippyImg.src = './images/characters/chippy.png';
    chippyImg.onload = () => setChippyImage(chippyImg);
    chippyImg.onerror = () => {
      console.log('Không tải được chippy.png, dùng hình mặc định');
      // Tạo hình mặc định
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(75, 75, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 60px Arial';
        ctx.fillText('🎉', 55, 95);
        const defaultImg = new Image();
        defaultImg.src = canvas.toDataURL();
        setChippyImage(defaultImg);
      }
    };
  };
  
  loadEffectImages();
}, []);
  
  // Đăng ký callback
  useEffect(() => {
  setCallbacks({
    onWordComplete: (word: string) => {
      triggerCelebration();
      playCompleteSound();
    }
  });
}, [setCallbacks, currentWord.word]);
  
  // Responsive canvas size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const ratio = 1200 / 700;
        let width = Math.min(containerWidth, 1400);
        let height = width / ratio;
        
        if (height > window.innerHeight - 200) {
          height = window.innerHeight - 200;
          width = height * ratio;
        }
        
        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // Load hình ảnh bong bóng
  useEffect(() => {
    const loadImages = async () => {
      const imageMap = new Map();
      
      for (const src of BUBBLE_IMAGES) {
        const img = new Image();
        img.src = src;
        await new Promise((resolve) => {
          img.onload = () => {
            imageMap.set(src, img);
            resolve(img);
          };
          img.onerror = () => {
            const defaultImg = new Image();
            defaultImg.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="55" fill="${src.includes('red') ? '%23FF6B6B' : '%234ECDC4'}"/></svg>`;
            imageMap.set(src, defaultImg);
            resolve(defaultImg);
          };
        });
      }
      
      setLoadedImages(imageMap);
    };

    loadImages();
  }, []);
  
  // Mouse move handler
  useEffect(() => {
  const handleGlobalMouseMove = (e: MouseEvent) => {
    // Lưu vị trí chuột toàn màn hình
    setGlobalMousePos({ x: e.clientX, y: e.clientY });
    
    // Tính vị trí tương đối trên canvas để bắn bong bóng
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasSize.width / rect.width;
      const scaleY = canvasSize.height / rect.height;
      setMousePos({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      });
    }
  };
  
  // Lắng nghe trên toàn bộ window, không chỉ canvas
  window.addEventListener('mousemove', handleGlobalMouseMove);
  return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
}, [canvasSize]);
  
  // Canvas click handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const hitBubble = bubbles.find(bubble => {
      const dx = clickX - bubble.x;
      const dy = clickY - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < hitRadius && !bubble.isPopped;
    });

    if (hitBubble) {
      triggerExplode(hitBubble.x, hitBubble.y);
      sounds.pop.pause();
      sounds.pop.currentTime = 0;
      sounds.pop.play().catch(e => console.log('Audio play failed:', e));
      shootBubble(hitBubble.id, hitBubble.letter);
    }
  };
  
  // Canvas render effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bubbleRadius = bubbleSize / 2;
    const textOffset = 20;
    
    bubbles.forEach(bubble => {
      if (!bubble.isPopped) {
        const img = loadedImages.get(bubble.imageUrl);
        
        if (img) {
          ctx.save();
          
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = bubbleSize / 8;
          ctx.shadowOffsetY = bubbleSize / 12;
          
          ctx.globalAlpha = 0.95;
          ctx.drawImage(img, bubble.x - bubbleRadius, bubble.y - bubbleRadius, bubbleSize, bubbleSize);
          
          ctx.shadowColor = 'transparent';
          const smallerFontSize = Math.floor(fontSize * 0.85);
          ctx.font = `bold ${smallerFontSize}px "Arial", "Segoe UI"`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Vẽ viền đen
          ctx.fillStyle = 'black';
          ctx.fillText(bubble.letter, bubble.x - 2, bubble.y - textOffset);
          ctx.fillText(bubble.letter, bubble.x + 2, bubble.y - textOffset);
          ctx.fillText(bubble.letter, bubble.x, bubble.y - textOffset - 2);
          ctx.fillText(bubble.letter, bubble.x, bubble.y - textOffset + 2);
          
          // Vẽ chữ trắng
          ctx.fillStyle = 'white';
          ctx.fillText(bubble.letter, bubble.x, bubble.y - textOffset);
          
          ctx.restore();
        }
      }
    });
    
    // Vẽ hiệu ứng nổ
    if (explodeEffect.active && explodeImage) {
      const explodeSize = bubbleSize * 1.2;
      ctx.drawImage(explodeImage, explodeEffect.x - explodeSize/2, explodeEffect.y - explodeSize/2, explodeSize, explodeSize);
    }

    // Vẽ tâm ngắm
    ctx.shadowColor = 'transparent';
    const crosshairSize = getCrosshairSize(canvasSize.width);
    const lineWidth = getLineWidth(canvasSize.width);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, crosshairSize, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = 'red';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, crosshairSize + 3, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = lineWidth;
    const lineLength = crosshairSize + 10;
    ctx.moveTo(mousePos.x - lineLength, mousePos.y);
    ctx.lineTo(mousePos.x - crosshairSize - 5, mousePos.y);
    ctx.moveTo(mousePos.x + crosshairSize + 5, mousePos.y);
    ctx.lineTo(mousePos.x + lineLength, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - lineLength);
    ctx.lineTo(mousePos.x, mousePos.y - crosshairSize - 5);
    ctx.moveTo(mousePos.x, mousePos.y + crosshairSize + 5);
    ctx.lineTo(mousePos.x, mousePos.y + lineLength);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.arc(mousePos.x, mousePos.y, Math.max(3, canvasSize.width / 200), 0, Math.PI * 2);
    ctx.fill();

  }, [bubbles, mousePos, loadedImages, canvasSize, bubbleSize, fontSize, hitRadius, explodeEffect, explodeImage]);

return (
  <div style={{
    position: 'relative',
    width: '100%',
    height: '100vh',
    background: 'black',
    overflow: 'hidden'
  }}>
    // Thêm vào return, trước khi vẽ game (khi showTutorial = true)

  {showTutorial && (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '30px',
        padding: '40px',
        maxWidth: '600px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '36px',
          color: '#667eea',
          marginBottom: '20px'
        }}>
          🎈 Balloon Letter Picker
        </h1>
        
        <div style={{
          textAlign: 'left',
          margin: '30px 0',
          padding: '0 20px'
        }}>
          <h3 style={{ color: '#764ba2', marginBottom: '15px' }}>📖 How to Play:</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>🎯</span>
            <span style={{ fontSize: '16px' }}>Move your mouse to aim</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>🖱️</span>
            <span style={{ fontSize: '16px' }}>Click on balloons to shoot them</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>🔤</span>
            <span style={{ fontSize: '16px' }}>Shoot letters in the correct order to spell the word</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>⭐</span>
            <span style={{ fontSize: '16px' }}>+10 points for each correct letter</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>💡</span>
            <span style={{ fontSize: '16px' }}>Use the hint to help you guess the word</span>
          </div>
        </div>
        
        <button
          onClick={() => {
            setShowTutorial(false);
            setGameStarted(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 50px',
            fontSize: '24px',
            fontWeight: 'bold',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 10px 20px rgba(102,126,234,0.4)',
            marginTop: '20px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(102,126,234,0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 20px rgba(102,126,234,0.4)';
          }}
        >
          🚀 START GAME
        </button>
      </div>
    </div>
  )}
  
    {/* Canvas full màn hình */}
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      onClick={handleCanvasClick}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: 'none',
        display: 'block'
      }}
    />
    
    
    {/* WordDisplay đè lên canvas */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      padding: '20px 20px 0 20px',
      pointerEvents: 'none' // Cho phép click xuyên qua để bắn bong bóng
    }}>
      <div style={{ pointerEvents: 'auto' }}> {/* Giữ cho WordDisplay vẫn tương tác được */}
        <WordDisplay 
          currentWord={currentWord}
          currentProgress={currentProgress}
          score={score}
          level={level}
          totalWords={totalWords}
        />
      </div>
    </div>
    
    {/* Toast thông báo */}
    {toastMessage.visible && (
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: toastMessage.type === 'success' ? '#48bb78' : toastMessage.type === 'error' ? '#f56565' : '#4299e1',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '50px',
        zIndex: 200,
        fontSize: '18px',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        animation: 'fadeInOut 1.5s ease'
      }}>
        {toastMessage.text}
      </div>
    )}
    
    {/* Nhân vật chúc mừng */}
    {showCelebration && chippyImage && (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 300,
        animation: 'celebrate 0.5s ease-out, float 0.5s ease-in-out infinite'
      }}>
        <img 
          src={chippyImage.src} 
          alt="Chippy" 
          style={{
            width: '300px',
            height: '300px',
            objectFit: 'contain'
          }}
        />
      </div>
    )}
    
    {gameOver && (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(255,255,255,0.95)',
        padding: 'min(60px, 8vw)',
        borderRadius: 'min(30px, 5vw)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
        textAlign: 'center',
        zIndex: 1000,
        minWidth: 'min(500px, 80vw)',
        maxWidth: '90vw',
        animation: 'slideIn 0.5s ease-out'
      }}>
        <h1 style={{ fontSize: 'min(80px, 12vw)', marginBottom: '10px' }}>🏆</h1>
        <h2 style={{ 
          fontSize: 'min(48px, 8vw)', 
          color: '#667eea', 
          marginBottom: '15px' 
        }}>
          YOU ARE THE WINNER!
        </h2>
        <p style={{ 
          fontSize: 'min(36px, 6vw)', 
          margin: '20px 0',
          color: '#764ba2',
          fontWeight: 'bold'
        }}>
          {score} score
        </p>
        <p style={{ 
          fontSize: 'min(24px, 4vw)', 
          color: '#666', 
          marginBottom: '30px' 
        }}>
          You have completed {totalWords} words!
        </p>
        <button 
          onClick={handleResetGame}
          style={{
            padding: 'min(20px, 4vw) min(60px, 10vw)',
            fontSize: 'min(28px, 5vw)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 10px 20px rgba(102, 126, 234, 0.4)',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          PLAY AGAIN
        </button>
      </div>
    )}

    <style>
      {`
        @keyframes slideIn {
          from {
            transform: translate(-50%, -30%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
          15% { opacity: 1; transform: translateX(-50%) scale(1); }
          85% { opacity: 1; transform: translateX(-50%) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) scale(0.8); }
        }
        
        @keyframes celebrate {
          0% { transform: translate(-50%, -50%) scale(0); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        
        @keyframes float {
          0% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
          100% { transform: translate(-50%, -50%) translateY(0px); }
        }
      `}
    </style>
  </div>
);
};

export default Game;