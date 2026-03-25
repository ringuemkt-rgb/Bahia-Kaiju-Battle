import { useLocation, useParams } from "wouter";
import { useEffect, useState, useRef } from "react";
import baixoSulBg from "../assets/baixo_sul_bg.png";
import kaijuSprite from "../assets/kaiju_sprite.png";
import woodenBoat from "../assets/wooden_boat.png";
import speedboat from "../assets/speedboat.png";

// --- Game Logic Types ---
type Weather = 'clear' | 'rain' | 'fog' | 'storm';
type Tide = 'high' | 'low' | 'normal';
type NPCState = 'idle' | 'fleeing' | 'panicking' | 'attacking';
type ObjectType = 'boat' | 'speedboat' | 'building' | 'military';

interface GameEntity {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  hp: number;
  state?: NPCState;
  vx?: number;
  vy?: number;
}

export default function Level() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  
  // --- Game State ---
  const [destruction, setDestruction] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [energy, setEnergy] = useState(100);
  
  // Environment Systems
  const [weather, setWeather] = useState<Weather>('clear');
  const [tide, setTide] = useState<Tide>('normal');
  const [isNight, setIsNight] = useState(false);
  const [isEarthquake, setIsEarthquake] = useState(false);

  // Entities
  const [entities, setEntities] = useState<GameEntity[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  
  // Simulation Loop
  useEffect(() => {
    // Initial spawn based on city
    const initialEntities: GameEntity[] = [];
    if (id === 'itacare' || id === 'valenca' || id === 'camamu') {
      for(let i=0; i<3; i++) {
        initialEntities.push({
          id: `boat-${i}`, type: 'boat', x: 20 + Math.random() * 60, y: 70 + Math.random() * 10, hp: 30, state: 'idle'
        });
      }
      initialEntities.push({
        id: `speed-${Date.now()}`, type: 'speedboat', x: 80, y: 75, hp: 50, state: 'idle'
      });
    }
    setEntities(initialEntities);

    // Main Game Loop (Mock)
    const interval = setInterval(() => {
      // Regen
      setEnergy(prev => Math.min(100, prev + 2));
      
      // Random Environment Changes (Accelerated for prototype)
      if (Math.random() < 0.05) {
        const weathers: Weather[] = ['clear', 'rain', 'fog', 'storm'];
        const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
        setWeather(newWeather);
        addMessage(`Clima mudou para: ${newWeather}`);
      }
      
      if (Math.random() < 0.02) {
        setTide(prev => prev === 'high' ? 'low' : prev === 'low' ? 'normal' : 'high');
        addMessage(`Maré alterada`);
      }

      if (Math.random() < 0.01 && !isEarthquake) {
        triggerEarthquake();
      }

      // NPC / Entity Logic
      setEntities(prev => prev.map(ent => {
        // Simple AI logic
        let newX = ent.x;
        let newState = ent.state;

        if (ent.type === 'speedboat' && newState === 'idle' && Math.random() < 0.1) {
          newState = 'fleeing';
        }

        if (newState === 'fleeing') {
          newX += 2; // Move right to escape
        }

        return { ...ent, x: newX, state: newState };
      }).filter(ent => ent.x < 110)); // Remove if off-screen

    }, 1000);

    return () => clearInterval(interval);
  }, [id]);

  const triggerEarthquake = () => {
    setIsEarthquake(true);
    addMessage("TERREMOTO DETECTADO!");
    setDestruction(prev => Math.min(100, prev + 15));
    
    setTimeout(() => {
      setIsEarthquake(false);
    }, 4000);
  };

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev.slice(-4), msg]);
  };

  const handleAttack = (type: 'punch' | 'beam' | 'stomp' | 'grab') => {
    let cost = 0;
    let damage = 0;
    
    switch(type) {
      case 'punch': cost = 10; damage = 5; break;
      case 'beam': cost = 40; damage = 15; break;
      case 'stomp': cost = 25; damage = 10; break;
      case 'grab': cost = 15; damage = 20; break; // Grab/throw objects
    }

    // Weather modifiers
    if (weather === 'storm' && type === 'beam') damage *= 1.5; // Lightning amplifies beam
    if (tide === 'high' && type === 'stomp') damage *= 0.8; // Water cushions stomp

    if (energy >= cost) {
      setEnergy(prev => prev - cost);
      
      // Calculate hits on entities
      if (type === 'grab') {
        const grabable = entities.find(e => (e.type === 'boat' || e.type === 'speedboat') && e.x > 10 && e.x < 40);
        if (grabable) {
          addMessage(`Arremessou ${grabable.type}!`);
          setEntities(prev => prev.filter(e => e.id !== grabable.id));
          damage += 20;
        } else {
          addMessage("Nada para agarrar!");
          return; // Refund energy? For now just fail
        }
      } else {
        // Normal attack - destroy nearby
        const hitEntities = entities.filter(e => e.x > 10 && e.x < 50);
        if (hitEntities.length > 0) {
           setEntities(prev => prev.filter(e => e.x <= 10 || e.x >= 50));
           damage += hitEntities.length * 10;
           addMessage(`Destruiu ${hitEntities.length} alvo(s)!`);
        }
      }

      setDestruction(prev => Math.min(100, prev + damage));
      setScore(prev => prev + (damage * 100));
      
      // Screen shake
      const screen = document.getElementById('game-screen');
      if (screen) {
        screen.classList.add('animate-shake');
        setTimeout(() => screen.classList.remove('animate-shake'), 300);
      }
    } else {
      addMessage("Energia Insuficiente!");
    }
  };

  // Dynamic Styles
  const getEnvironmentStyles = () => {
    let overlay = "bg-transparent";
    let filters = "";

    if (isNight) overlay = "bg-blue-900/60 mix-blend-multiply";
    if (weather === 'rain') overlay = "bg-gray-500/40 mix-blend-multiply";
    if (weather === 'storm') overlay = "bg-purple-900/50 mix-blend-multiply";
    if (weather === 'fog') filters = "blur-[2px] brightness-125";
    
    return { overlay, filters };
  };

  const envStyles = getEnvironmentStyles();

  return (
    <div 
      id="game-screen" 
      className={`relative w-full h-screen overflow-hidden flex flex-col pixelated-render ${isEarthquake ? 'animate-shake' : ''}`}
      style={{
        backgroundColor: isNight ? '#0a192f' : '#87ceeb'
      }}
    >
      
      {/* Dynamic Background Parallax */}
      <div 
        className={`absolute inset-0 z-0 transition-all duration-1000 ${envStyles.filters}`}
        style={{
          backgroundImage: `url(${baixoSulBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'repeat-x',
          // Adjust water level visually based on tide
          transform: tide === 'high' ? 'translateY(5%)' : tide === 'low' ? 'translateY(-5%)' : 'none'
        }}
      />
      
      {/* Weather/Time Overlays */}
      <div className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-1000 ${envStyles.overlay}`} />
      
      {/* Rain Effect */}
      {(weather === 'rain' || weather === 'storm') && (
         <div className="absolute inset-0 z-15 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjUwIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+PC9zdmc+')] animate-[rain_0.5s_linear_infinite]" />
      )}

      {/* Fog Effect */}
      {weather === 'fog' && (
        <div className="absolute inset-0 z-15 pointer-events-none bg-white/30 backdrop-blur-sm" />
      )}

      <div className="scanlines z-50 pointer-events-none" />

      {/* HUD Top */}
      <div className="absolute top-0 left-0 w-full p-4 z-40 flex justify-between items-start pointer-events-none">
        {/* Left Stats */}
        <div className="flex flex-col gap-2 w-1/3 max-w-xs">
          <div className="w-full bg-black/80 border-2 border-white p-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-display text-[10px] text-white">HP</span>
              <span className="font-display text-[10px] text-white">{health}%</span>
            </div>
            <div className="w-full h-3 bg-gray-800">
              <div className="h-full bg-destructive transition-all duration-300" style={{ width: `${health}%` }} />
            </div>
          </div>
          
          <div className="w-full bg-black/80 border-2 border-white p-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-display text-[10px] text-white">EN</span>
              <span className="font-display text-[10px] text-white">{energy}%</span>
            </div>
            <div className="w-full h-3 bg-gray-800">
              <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${energy}%` }} />
            </div>
          </div>
        </div>

        {/* Center Environmental Info */}
        <div className="flex flex-col items-center gap-1">
           <div className="bg-black/80 border-2 border-white px-2 py-1 flex items-center gap-2">
             <span className="font-display text-[8px] text-blue-300 uppercase">Clima: {weather}</span>
             <span className="font-display text-[8px] text-blue-400 uppercase">Maré: {tide}</span>
           </div>
           <button 
              onClick={() => setIsNight(!isNight)}
              className="pointer-events-auto bg-black/60 border border-white text-[8px] font-display text-white px-1 hover:bg-black"
            >
              [DEBUG: Alternar Dia/Noite]
            </button>
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

      {/* Destrucion Meter & Messages */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-1/2 max-w-sm pointer-events-none flex flex-col items-center gap-2">
        <div className="bg-black/80 border-2 border-white p-1 text-center w-full">
          <div className="font-display text-[10px] text-white mb-1 uppercase">Destruição de {id}</div>
          <div className="w-full h-2 bg-gray-800 relative">
            <div className="absolute inset-0 bg-red-900/30" />
            <div className="h-full bg-primary transition-all duration-300 relative z-10" style={{ width: `${destruction}%` }} />
          </div>
        </div>

        {/* Action Log / AI Messages */}
        <div className="w-full text-center flex flex-col items-center mt-2">
          {messages.map((msg, i) => (
             <div key={i} className="font-sans text-lg text-white pixel-text-shadow opacity-80 animate-in fade-in slide-in-from-bottom-2">
               {msg}
             </div>
          ))}
        </div>
      </div>

      {/* Play Area */}
      <div className="flex-1 relative z-20 flex items-end pb-[140px] md:pb-[160px]">
        
        {/* Dynamic Entities (NPCs, Boats) */}
        {entities.map(ent => (
          <div 
            key={ent.id}
            className="absolute transition-all duration-1000 ease-linear"
            style={{ 
              left: `${ent.x}%`, 
              bottom: `${ent.y > 50 ? '20%' : '10%'}`, // Crude depth
              width: ent.type === 'boat' ? '60px' : '80px',
              height: ent.type === 'boat' ? '60px' : '80px',
            }}
          >
            <img 
              src={ent.type === 'boat' ? woodenBoat : speedboat} 
              alt={ent.type}
              className={`w-full h-full object-contain filter drop-shadow-lg ${ent.state === 'fleeing' ? 'animate-bounce' : ''}`}
              style={{
                // Bobbing based on tide
                transform: tide === 'high' ? 'translateY(-10px)' : tide === 'low' ? 'translateY(10px)' : 'none'
              }}
            />
            {ent.state === 'fleeing' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-red-500 font-display text-[8px] pixel-text-shadow">!</div>
            )}
          </div>
        ))}

        {/* Kaiju Character */}
        <div className="relative w-48 h-48 md:w-72 md:h-72 ml-[10%] z-30">
          <img 
            src={kaijuSprite} 
            alt="Kaiju" 
            className="w-full h-full object-contain filter drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Controls Bottom */}
      <div className="absolute bottom-0 w-full h-36 md:h-40 bg-black/90 border-t-4 border-white z-40 p-2 flex justify-between items-center gap-2">
        <div className="flex gap-2 h-full">
          <div className="w-24 md:w-32 h-full grid grid-cols-2 grid-rows-2 gap-1 p-1">
            <button className="col-span-2 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center font-display text-xs text-white active:bg-gray-600">&uarr;</button>
            <button className="bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center font-display text-xs text-white active:bg-gray-600">&larr;</button>
            <button className="bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center font-display text-xs text-white active:bg-gray-600">&rarr;</button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 md:gap-3 h-full py-1 px-2 items-center">
           <button 
            onClick={() => handleAttack('grab')}
            disabled={energy < 15}
            className="w-14 h-14 md:w-16 md:h-16 rounded border-2 border-white bg-amber-700 text-white font-display text-[8px] md:text-[10px] flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
          >
            <span>PEGAR</span>
            <span className="text-[6px] text-white/70">-15E</span>
          </button>

          <button 
            onClick={() => handleAttack('punch')}
            disabled={energy < 10}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-primary text-white font-display text-[10px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
          >
            <span>SOCO</span>
            <span className="text-[8px] text-white/70">-10E</span>
          </button>
          
          <button 
            onClick={() => handleAttack('stomp')}
            disabled={energy < 25}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-orange-600 text-white font-display text-[10px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
          >
            <span>PISAR</span>
            <span className="text-[8px] text-white/70">-25E</span>
          </button>

          <button 
            onClick={() => handleAttack('beam')}
            disabled={energy < 40}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white bg-secondary text-white font-display text-[10px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
          >
            <span>RAIO</span>
            <span className="text-[8px] text-white/70">-40E</span>
          </button>
        </div>
      </div>
      
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
        @keyframes rain {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
      `}} />
    </div>
  );
}