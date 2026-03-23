import React, { useEffect, useRef } from 'react';
import type { Player as PlayerType } from '../types/game.types';

interface PlayerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  player: PlayerType;
  imageSrc?: string;
}

const Player: React.FC<PlayerProps> = ({ 
  canvasRef, 
  player,
  imageSrc = '/images/plane.png'
}) => {
  const playerImage = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    playerImage.current.src = imageSrc;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      if (!playerImage.current.complete) return;
      
      ctx.save();
      ctx.translate(
        player.x + player.width / 2,
        player.y + player.height / 2
      );
      
      // Add subtle rotation for visual effect
      const rotation = Math.sin(Date.now() * 0.01) * 0.1;
      ctx.rotate(rotation);
      
      ctx.drawImage(
        playerImage.current,
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
      );
      ctx.restore();
    };
    
    draw();
  }, [canvasRef, player, imageSrc]);

  return null;
};

export default Player;