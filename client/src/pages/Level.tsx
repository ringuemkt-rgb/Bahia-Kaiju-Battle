import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import salvadorBg from "../assets/salvador_bg.png";
import kaijuSprite from "../assets/kaiju_sprite.png";

export default function Level() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  
  const [destruction, setDestruction] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [energy, setEnergy] = useState(100);
  
  // Simple game loop simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => Math.min(100, prev + 2));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAttack = (type: 'punch' | 'beam' | 'stomp') => {
    let cost = 0;
    let damage = 0;
    
    switch(type) {
      case 'punch': cost = 10; damage = 5; break;
      case 'beam': cost = 40; damage = 15; break;
      case 'stomp': cost = 25; damage = 10; break;
    }

    if (energy >= cost) {
      setEnergy(prev => prev - cost);
      setDestruction(prev => Math.min(100, prev + damage));
      setScore(prev => prev + (damage * 100));
      
      // Screen shake effect
      const screen = document.getElementById('game-screen');
      if (screen) {
        screen.classList.add('animate-shake');
        setTimeout(() => screen.classList.remove('animate-shake'), 300);
      }
    }
  };

  return (
    <div id="game-screen" className="relative w-full h-screen bg-sky-300 overflow-hidden flex flex-col pixelated-render">
      
      {/* Background Parallax Layers (Simplified) */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${salvadorBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'repeat-x'
        }}
      />
      
      <div className="scanlines z-50" />

      {/* HUD Top */}
      <div className="absolute top-0 left-0 w-full p-4 z-40 flex justify-between items-start pointer-events-none">
        {/* Left Stats */}
        <div className="flex flex-col gap-2 w-1/3 max-w-xs">
          {/* Health Bar */}
          <div className="w-full bg-black/80 border-2 border-white p-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-display text-[10px] text-white">HP</span>
              <span className="font-display text-[10px] text-white">{health}%</span>
            </div>
            <div className="w-full h-3 bg-gray-800">
              <div 
                className="h-full bg-destructive transition-all duration-300"
                style={{ width: `${health}%` }}
              />
            </div>
          </div>
          
          {/* Energy Bar */}
          <div className="w-full bg-black/80 border-2 border-white p-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-display text-[10px] text-white">EN</span>
              <span className="font-display text-[10px] text-white">{energy}%</span>
            </div>
            <div className="w-full h-3 bg-gray-800">
              <div 
                className="h-full bg-secondary transition-all duration-300"
                style={{ width: `${energy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Stats */}
        <div className="flex flex-col items-end gap-2">
          <div className="bg-black/80 border-2 border-white px-3 py-1">
            <span className="font-display text-sm text-accent">PTS: {score.toString().padStart(6, '0')}</span>
          </div>
          <button 
            onClick={() => setLocation('/map')}
            className="pointer-events-auto bg-black/80 text-white font-sans text-lg px-2 border-2 border-white hover:bg-black"
          >
            &lt; PAUSA
          </button>
        </div>
      </div>

      {/* Destrucion Meter */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 w-1/2 max-w-sm pointer-events-none">
        <div className="bg-black/80 border-2 border-white p-1 text-center">
          <div className="font-display text-[10px] text-white mb-1">DESTRUIÇÃO DA CIDADE</div>
          <div className="w-full h-2 bg-gray-800">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${destruction}%` }}
            />
          </div>
        </div>
      </div>

      {/* Play Area */}
      <div className="flex-1 relative z-20 flex items-end pb-32">
        {/* Kaiju Character */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 ml-[10%]">
          <img 
            src={kaijuSprite} 
            alt="Kaiju" 
            className="w-full h-full object-contain filter drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Controls Bottom */}
      <div className="absolute bottom-0 w-full h-32 bg-black/80 border-t-4 border-white z-40 p-2 flex justify-between items-center gap-2">
        <div className="flex gap-2 h-full">
          {/* Movement Placeholder */}
          <div className="w-24 h-full grid grid-cols-2 grid-rows-2 gap-1 p-1">
            <button className="col-span-2 bg-gray-700 border-2 border-gray-500 rounded flex items-center justify-center font-display text-xs text-white active:bg-gray-600">&uarr;</button>
            <button className="bg-gray-700 border-2 border-gray-500 rounded flex items-center justify-center font-display text-xs text-white active:bg-gray-600">&larr;</button>
            <button className="bg-gray-700 border-2 border-gray-500 rounded flex items-center justify-center font-display text-xs text-white active:bg-gray-600">&rarr;</button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 md:gap-4 h-full py-2 px-4">
          <button 
            onClick={() => handleAttack('punch')}
            disabled={energy < 10}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-primary text-white font-display text-[10px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 transition-transform"
          >
            <span>SOCO</span>
            <span className="text-[8px] text-primary-foreground/70">-10E</span>
          </button>
          
          <button 
            onClick={() => handleAttack('stomp')}
            disabled={energy < 25}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-orange-600 text-white font-display text-[10px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 transition-transform"
          >
            <span>PISAR</span>
            <span className="text-[8px] text-white/70">-25E</span>
          </button>

          <button 
            onClick={() => handleAttack('beam')}
            disabled={energy < 40}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white bg-secondary text-white font-display text-[10px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 transition-transform self-center"
          >
            <span>RAIO</span>
            <span className="text-[8px] text-white/70">-40E</span>
          </button>
        </div>
      </div>
      
      {/* CSS Animation for Shake */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-shake {
          animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
}