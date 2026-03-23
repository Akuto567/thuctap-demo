import React, { useEffect, useRef } from 'react';

interface BackgroundProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  speed?: number;
  imageSrc?: string;
}

const Background: React.FC<BackgroundProps> = ({ 
  canvasRef, 
  speed = 2,
  imageSrc = '/images/background.jpg'
}) => {
  const backgroundXRef = useRef<number>(0);
  const backgroundImage = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    backgroundImage.current.src = imageSrc;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (backgroundImage.current.complete) {
        // Draw backgrounds for seamless scrolling
        ctx.drawImage(
          backgroundImage.current,
          backgroundXRef.current,
          0,
          canvas.width,
          canvas.height
        );
        
        ctx.drawImage(
          backgroundImage.current,
          backgroundXRef.current + canvas.width,
          0,
          canvas.width,
          canvas.height
        );
      }
      
      // Move background left
      backgroundXRef.current -= speed;
      
      // Reset position for infinite scroll
      if (backgroundXRef.current <= -canvas.width) {
        backgroundXRef.current = 0;
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [canvasRef, speed, imageSrc]);

  return null;
};

export default Background;