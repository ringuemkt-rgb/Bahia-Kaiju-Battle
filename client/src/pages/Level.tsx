import { useLocation, useParams } from "wouter";
import { useEffect, useState, useRef } from "react";
import baixoSulBg from "../assets/baixo_sul_bg.png";
import kaijuSprite from "../assets/kaiju_sprite.png";
import woodenBoat from "../assets/wooden_boat.png";
import speedboat from "../assets/speedboat.png";
import humanNpc from "../assets/human_npc.png";
import bossMilitary from "../assets/boss_military.png";

// --- Game Logic Types ---
type Weather = 'clear' | 'rain' | 'fog' | 'storm';
type Tide = 'high' | 'low' | 'normal';
type NPCState = 'idle' | 'fleeing' | 'panicking' | 'attacking' | 'dead';
type ObjectType = 'boat' | 'speedboat' | 'human' | 'military' | 'boss';

interface GameEntity {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  hp: number;
  maxHp?: number;
  state: NPCState;
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
  const [wantedLevel, setWantedLevel] = useState(0);
  
  // Environment Systems
  const [weather, setWeather] = useState<Weather>('clear');
  const [tide, setTide] = useState<Tide>('normal');
  const [isNight, setIsNight] = useState(false);
  const [isEarthquake, setIsEarthquake] = useState(false);

  // Entities & Combat
  const [entities, setEntities] = useState<GameEntity[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [grabbedItem, setGrabbedItem] = useState<GameEntity | null>(null);
  const [bossActive, setBossActive] = useState(false);
  
  // Simulation Loop
  useEffect(() => {
    // Initial spawn
    const initialEntities: GameEntity[] = [];
    
    // Spawn some humans
    for(let i=0; i<5; i++) {
        initialEntities.push({
          id: `human-${i}`, type: 'human', x: 30 + Math.random() * 50, y: 15 + Math.random() * 10, hp: 10, state: 'panicking'
        });
    }

    if (id === 'itacare' || id === 'valenca' || id === 'camamu') {
      for(let i=0; i<2; i++) {
        initialEntities.push({
          id: `boat-${i}`, type: 'boat', x: 20 + Math.random() * 60, y: 60 + Math.random() * 10, hp: 30, state: 'idle'
        });
      }
    }
    
    setEntities(initialEntities);

    // Main Game Loop
    const interval = setInterval(() => {
      // Regen
      setEnergy(prev => Math.min(100, prev + 2));
      
      // Random Environment Changes (Accelerated)
      if (Math.random() < 0.05) {
        const weathers: Weather[] = ['clear', 'rain', 'fog', 'storm'];
        setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
      }
      
      // Boss Spawn Logic
      if (destruction > 50 && !bossActive) {
          setBossActive(true);
          addMessage("ALERTA: COLOSSO MILITAR DETECTADO!");
          setEntities(prev => [...prev, {
              id: 'boss-1', type: 'boss', x: 80, y: 30, hp: 200, maxHp: 200, state: 'attacking'
          }]);
      }

      // Entity AI
      setEntities(prev => prev.map(ent => {
        let newX = ent.x;
        let newState = ent.state;

        if (ent.type === 'human') {
             // Humans run away randomly
             newX += (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 3);
             newX = Math.max(0, Math.min(100, newX));
        }

        if (ent.type === 'boat' && newState === 'idle' && Math.random() < 0.1) {
          newState = 'fleeing';
        }

        if (newState === 'fleeing') {
          newX += 2;
        }
        
        if (ent.type === 'boss') {
            // Boss logic - slowly move left
            newX -= 0.5;
            if (Math.random() < 0.1) {
                // Boss attack
                setHealth(h => Math.max(0, h - 5));
                addMessage("Boss atacou!");
            }
        }

        return { ...ent, x: newX, state: newState };
      }).filter(ent => ent.x < 120 && ent.hp > 0)); 

    }, 1000);

    return () => clearInterval(interval);
  }, [id, destruction, bossActive]);

  const triggerEarthquake = () => {
    setIsEarthquake(true);
    addMessage("TERREMOTO DETECTADO!");
    setDestruction(prev => Math.min(100, prev + 15));
    setTimeout(() => setIsEarthquake(false), 4000);
  };

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev.slice(-3), msg]);
  };

  const handleAttack = (type: 'punch' | 'beam' | 'stomp' | 'grab' | 'eat' | 'throw') => {
    let cost = 0;
    let damage = 0;
    let attackRange = [10, 40]; // Base range x=10 to x=40
    
    switch(type) {
      case 'punch': cost = 10; damage = 15; break;
      case 'beam': cost = 40; damage = 40; attackRange = [10, 90]; break; // Beam goes far
      case 'stomp': cost = 25; damage = 25; attackRange = [0, 30]; break;
      case 'eat': cost = 5; damage = 100; attackRange = [10, 30]; break; // Instakill small things
      case 'grab': cost = 15; damage = 0; attackRange = [10, 40]; break;
      case 'throw': cost = 10; damage = 50; attackRange = [10, 90]; break; // Thrown objects do big damage
    }

    if (energy >= cost) {
      setEnergy(prev => prev - cost);
      
      // Action logic
      if (type === 'grab') {
        const grabable = entities.find(e => (e.type === 'boat' || e.type === 'speedboat' || e.type === 'human') && e.x > attackRange[0] && e.x < attackRange[1]);
        if (grabable) {
          addMessage(`Agarrou ${grabable.type}!`);
          setGrabbedItem(grabable);
          setEntities(prev => prev.filter(e => e.id !== grabable.id));
        } else {
          addMessage("Nada para agarrar!");
        }
        return;
      }

      if (type === 'throw' && grabbedItem) {
          addMessage(`Arremessou ${grabbedItem.type}!`);
          setGrabbedItem(null);
          // Apply massive damage to whatever is in range
          damage = 50 + (grabbedItem.type === 'boat' ? 50 : 10);
      }

      if (type === 'eat') {
          const edible = entities.find(e => e.type === 'human' && e.x > attackRange[0] && e.x < attackRange[1]);
          if (edible) {
              addMessage("Devorou Humano! +HP, +Wanted");
              setHealth(prev => Math.min(100, prev + 15));
              setWantedLevel(prev => Math.min(5, prev + 1));
              setEntities(prev => prev.filter(e => e.id !== edible.id));
          } else if (grabbedItem && grabbedItem.type === 'human') {
              addMessage("Devorou Humano! +HP, +Wanted");
              setHealth(prev => Math.min(100, prev + 15));
              setWantedLevel(prev => Math.min(5, prev + 1));
              setGrabbedItem(null);
          } else {
              addMessage("Nada para comer!");
          }
          return;
      }

      // Normal Combat Resolution
      let hitCount = 0;
      setEntities(prev => prev.map(e => {
          if (e.x > attackRange[0] && e.x < attackRange[1]) {
              hitCount++;
              return { ...e, hp: e.hp - damage };
          }
          return e;
      }));

      if (hitCount > 0 || type === 'throw') {
         setDestruction(prev => Math.min(100, prev + (damage/2)));
         setScore(prev => prev + (damage * 10));
      }

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
  const envStyles = {
      overlay: isNight ? "bg-blue-900/60 mix-blend-multiply" : weather === 'rain' ? "bg-gray-500/40 mix-blend-multiply" : weather === 'storm' ? "bg-purple-900/50 mix-blend-multiply" : "bg-transparent",
      filters: weather === 'fog' ? "blur-[2px] brightness-125" : ""
  };

  return (
    <div 
      id="game-screen" 
      className={`relative w-full h-screen overflow-hidden flex flex-col pixelated-render ${isEarthquake ? 'animate-shake' : ''}`}
      style={{ backgroundColor: isNight ? '#0a192f' : '#87ceeb' }}
    >
      
      {/* Background Parallax */}
      <div 
        className={`absolute inset-0 z-0 transition-all duration-1000 ${envStyles.filters}`}
        style={{
          backgroundImage: `url(${baixoSulBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'repeat-x',
          transform: tide === 'high' ? 'translateY(5%)' : tide === 'low' ? 'translateY(-5%)' : 'none'
        }}
      />
      
      <div className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-1000 ${envStyles.overlay}`} />
      
      {(weather === 'rain' || weather === 'storm') && (
         <div className="absolute inset-0 z-15 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjUwIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+PC9zdmc+')] animate-[rain_0.5s_linear_infinite]" />
      )}

      {weather === 'fog' && <div className="absolute inset-0 z-15 pointer-events-none bg-white/30 backdrop-blur-sm" />}

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
           </div>
           {/* Wanted Level */}
           <div className="flex gap-1 mt-1">
               {[1,2,3,4,5].map(star => (
                   <div key={star} className={`w-3 h-3 text-[10px] flex items-center justify-center font-display ${star <= wantedLevel ? 'text-yellow-400' : 'text-gray-600'}`}>
                       ★
                   </div>
               ))}
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

      {/* Action Log */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-md pointer-events-none">
        <div className="w-full text-center flex flex-col items-center">
          {messages.map((msg, i) => (
             <div key={i} className="font-sans text-lg md:text-xl text-white pixel-text-shadow bg-black/50 px-2 my-1 animate-in fade-in slide-in-from-bottom-2">
               {msg}
             </div>
          ))}
        </div>
      </div>

      {/* Play Area */}
      <div className="flex-1 relative z-20 flex items-end pb-[140px] md:pb-[160px]">
        
        {/* Dynamic Entities */}
        {entities.map(ent => (
          <div 
            key={ent.id}
            className="absolute transition-all duration-1000 ease-linear flex flex-col items-center"
            style={{ 
              left: `${ent.x}%`, 
              bottom: ent.type === 'boat' ? '20%' : '10%',
              width: ent.type === 'human' ? '30px' : ent.type === 'boss' ? '150px' : '60px',
              height: ent.type === 'human' ? '30px' : ent.type === 'boss' ? '150px' : '60px',
            }}
          >
            {ent.type === 'boss' && ent.maxHp && (
                <div className="w-full h-2 bg-gray-800 border border-white mb-2">
                    <div className="h-full bg-red-600" style={{width: `${(ent.hp / ent.maxHp) * 100}%`}} />
                </div>
            )}
            <img 
              src={ent.type === 'boat' ? woodenBoat : ent.type === 'human' ? humanNpc : ent.type === 'boss' ? bossMilitary : speedboat} 
              alt={ent.type}
              className={`w-full h-full object-contain filter drop-shadow-lg ${ent.state === 'fleeing' || ent.state === 'panicking' ? 'animate-bounce' : ''}`}
            />
          </div>
        ))}

        {/* Player Kaiju */}
        <div className="relative w-48 h-48 md:w-72 md:h-72 ml-[10%] z-30 flex items-center justify-center">
          <img 
            src={kaijuSprite} 
            alt="Kaiju" 
            className="w-full h-full object-contain filter drop-shadow-2xl"
          />
          {/* Held Item Overlay */}
          {grabbedItem && (
             <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 border-2 border-white rounded-full flex items-center justify-center animate-pulse">
                <img src={grabbedItem.type === 'boat' ? woodenBoat : humanNpc} className="w-10 h-10 object-contain" />
             </div>
          )}
        </div>
      </div>

      {/* Controls Bottom */}
      <div className="absolute bottom-0 w-full h-auto min-h-[140px] bg-black/90 border-t-4 border-white z-40 p-2">
         {/* Destrucion Meter - Moved to bottom for space */}
         <div className="w-full max-w-md mx-auto mb-2 flex items-center gap-2">
            <span className="font-display text-[8px] text-white">DESTRUIÇÃO</span>
            <div className="flex-1 h-2 bg-gray-800 border border-gray-600">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${destruction}%` }} />
            </div>
         </div>

        <div className="flex justify-between items-center gap-1 md:gap-2 h-full">
            {/* Movement Placeholder */}
            <div className="w-20 md:w-32 h-full grid grid-cols-2 grid-rows-2 gap-1 p-1">
                <button className="col-span-2 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center font-display text-xs text-white active:bg-gray-600">&uarr;</button>
                <button className="bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center font-display text-xs text-white active:bg-gray-600">&larr;</button>
                <button className="bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center font-display text-xs text-white active:bg-gray-600">&rarr;</button>
            </div>

            {/* Interaction Buttons (Grab/Eat/Throw) */}
            <div className="flex flex-col gap-1 w-16 md:w-20">
                 {grabbedItem ? (
                     <button 
                        onClick={() => handleAttack('throw')}
                        className="w-full h-12 bg-amber-600 border-2 border-white text-white font-display text-[8px] flex flex-col items-center justify-center active:scale-95"
                    >
                        <span>JOGAR</span>
                    </button>
                 ) : (
                    <button 
                        onClick={() => handleAttack('grab')}
                        disabled={energy < 15}
                        className="w-full h-12 bg-amber-800 border-2 border-gray-500 text-white font-display text-[8px] flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
                    >
                        <span>PEGAR</span>
                    </button>
                 )}
                 <button 
                    onClick={() => handleAttack('eat')}
                    className="w-full h-12 bg-green-700 border-2 border-white text-white font-display text-[8px] flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
                >
                    <span>COMER</span>
                    <span className="text-[6px] text-white/70">+HP</span>
                </button>
            </div>

            {/* Attack Buttons */}
            <div className="flex gap-1 md:gap-2 items-center">
            <button 
                onClick={() => handleAttack('punch')}
                disabled={energy < 10}
                className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-white bg-primary text-white font-display text-[8px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
            >
                <span>SOCO</span>
                <span className="text-[6px] text-white/70">-10E</span>
            </button>
            
            <button 
                onClick={() => handleAttack('stomp')}
                disabled={energy < 25}
                className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-white bg-orange-600 text-white font-display text-[8px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
            >
                <span>PISAR</span>
                <span className="text-[6px] text-white/70">-25E</span>
            </button>

            <button 
                onClick={() => handleAttack('beam')}
                disabled={energy < 40}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 md:border-4 border-white bg-secondary text-white font-display text-[8px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
            >
                <span>RAIO</span>
                <span className="text-[6px] text-white/70">-40E</span>
            </button>
            </div>
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