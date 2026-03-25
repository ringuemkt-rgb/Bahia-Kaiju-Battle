import { useLocation } from "wouter";
import { useState } from "react";
import lairBg from "../assets/lair_bg.png";
import kaijuSprite from "../assets/kaiju_sprite.png";
import crabKaiju from "../assets/crab_kaiju.png";
import birdKaiju from "../assets/bird_kaiju.png";

// --- Types ---
type BodyPart = 'head' | 'arms' | 'legs' | 'core' | 'tail' | 'wings';
type WeaponType = 'organic' | 'hybrid' | 'scrap';

interface KaijuClass {
  id: string;
  name: string;
  type: string;
  sprite: string;
  stats: { str: number; agi: number; def: number; atl: number };
  passive: string;
}

interface CustomPart {
  id: string;
  name: string;
  type: WeaponType;
  slot: BodyPart;
  bonus: string;
  description: string;
}

// --- Data ---
const CLASSES: KaijuClass[] = [
  { id: 'reptile', name: 'Lagarto Mutante', type: 'Equilíbrio', sprite: kaijuSprite, stats: { str: 6, agi: 5, def: 6, atl: 5 }, passive: 'Regeneração Rápida' },
  { id: 'crab', name: 'Guaiamum Titã', type: 'Tanque/Físico', sprite: crabKaiju, stats: { str: 8, agi: 2, def: 10, atl: 3 }, passive: 'Carapaça Impenetrável' },
  { id: 'bird', name: 'Garça Sombria', type: 'Voador/Assassino', sprite: birdKaiju, stats: { str: 4, agi: 10, def: 3, atl: 7 }, passive: 'Evasão Aérea' },
];

const ARSENAL: CustomPart[] = [
  { id: 'w1', name: 'Lâmina Óssea', type: 'organic', slot: 'arms', bonus: '+2 STR, Sangramento', description: 'Garras mutantes super afiadas.' },
  { id: 'w2', name: 'Marreta de Âncora', type: 'scrap', slot: 'arms', bonus: '+4 STR, Lentidão', description: 'Âncora de navio enferrujada usada como clava.' },
  { id: 'w3', name: 'Núcleo ATL Instável', type: 'hybrid', slot: 'core', bonus: '+5 ATL, -1 DEF', description: 'Reator militar fundido ao peito.' },
  { id: 'w4', name: 'Carapaça de Navio', type: 'scrap', slot: 'head', bonus: '+3 DEF', description: 'Casco de traineira usado como capacete.' },
  { id: 'w5', name: 'Cauda de Arraia', type: 'organic', slot: 'tail', bonus: '+3 AGI, Choque', description: 'Ferrão elétrico venenoso.' },
];

export default function Lair() {
  const [, setLocation] = useLocation();
  const [selectedClass, setSelectedClass] = useState<KaijuClass>(CLASSES[0]);
  const [equipped, setEquipped] = useState<Record<string, CustomPart | null>>({
    head: null, arms: null, legs: null, core: null, tail: null, wings: null
  });

  const equipItem = (part: CustomPart) => {
    setEquipped(prev => ({ ...prev, [part.slot]: part }));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row text-white pixelated-render font-sans">
      
      {/* Background */}
      <div 
        className="absolute inset-0 z-0 bg-gray-900"
        style={{
          backgroundImage: `url(${lairBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.6
        }}
      />
      <div className="scanlines z-50 pointer-events-none" />

      {/* Left Column: Selection & Stats */}
      <div className="relative z-10 w-full md:w-1/3 p-4 flex flex-col gap-4 border-b-4 md:border-b-0 md:border-r-4 border-white bg-black/80 overflow-y-auto">
        
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl text-accent pixel-text-shadow uppercase">
            TOCA DO MUTANTE
          </h2>
          <button 
            onClick={() => setLocation('/map')}
            className="border-2 border-white px-2 py-1 text-sm font-display hover:bg-white hover:text-black transition-colors"
          >
            SAIR
          </button>
        </div>

        {/* Class Selection */}
        <div className="mt-4">
          <h3 className="font-display text-xs mb-2 text-gray-400">ESCOLHA SUA FORMA</h3>
          <div className="flex gap-2">
            {CLASSES.map(cls => (
              <button 
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`w-12 h-12 border-2 ${selectedClass.id === cls.id ? 'border-primary bg-primary/20' : 'border-gray-600 bg-black'}`}
              >
                <img src={cls.sprite} alt={cls.name} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-900 border-2 border-gray-600 p-2 text-sm mt-2">
          <h3 className="font-display text-lg text-primary mb-1">{selectedClass.name}</h3>
          <p className="text-gray-400 mb-2">{selectedClass.type}</p>
          
          <div className="space-y-1">
            <div className="flex justify-between"><span>Força (STR):</span> <span>{selectedClass.stats.str}</span></div>
            <div className="flex justify-between"><span>Agilidade (AGI):</span> <span>{selectedClass.stats.agi}</span></div>
            <div className="flex justify-between"><span>Defesa (DEF):</span> <span>{selectedClass.stats.def}</span></div>
            <div className="flex justify-between text-secondary"><span>Poder ATL:</span> <span>{selectedClass.stats.atl}</span></div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-700">
            <span className="text-accent text-xs">PASSIVA:</span>
            <p className="text-xs">{selectedClass.passive}</p>
          </div>
        </div>

        {/* Arsenal / Parts List */}
        <div className="mt-2 flex-1">
          <h3 className="font-display text-xs mb-2 text-gray-400">ARSENAL E MUTAÇÕES</h3>
          <div className="space-y-2 max-h-[30vh] md:max-h-full overflow-y-auto pr-2">
            {ARSENAL.map(item => (
              <div 
                key={item.id}
                onClick={() => equipItem(item)}
                className="bg-gray-800 border-2 border-gray-600 p-2 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className="font-display text-[10px] text-white">{item.name}</span>
                  <span className="text-[8px] text-gray-400 uppercase">[{item.slot}]</span>
                </div>
                <p className="text-xs text-primary mt-1">{item.bonus}</p>
                <p className="text-[10px] text-gray-500 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Monster Preview */}
        <div className="relative w-48 h-48 md:w-80 md:h-80 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse blur-xl" />
          <img 
            src={selectedClass.sprite} 
            alt="Preview" 
            className="relative z-20 w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,100,0,0.5)]"
          />
          
          {/* Equipped Indicators (Visual placeholders) */}
          {Object.entries(equipped).map(([slot, item]) => {
            if (!item) return null;
            // Calculate rough positions based on slot
            let pos = {};
            switch(slot) {
              case 'head': pos = { top: '-10%', left: '50%', transform: 'translateX(-50%)' }; break;
              case 'arms': pos = { top: '40%', left: '-10%' }; break;
              case 'core': pos = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }; break;
              case 'tail': pos = { bottom: '-10%', right: '-10%' }; break;
            }
            return (
              <div key={slot} className="absolute z-30 flex flex-col items-center" style={pos}>
                <div className="w-2 h-2 md:w-4 md:h-4 bg-accent border border-white animate-ping" />
                <span className="bg-black/80 text-[8px] font-display px-1 border border-gray-500 hidden md:block whitespace-nowrap">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Start Button */}
        <button 
          onClick={() => setLocation('/map')}
          className="mt-12 bg-primary border-4 border-white text-white font-display text-xl md:text-3xl px-8 py-4 hover:bg-red-600 active:scale-95 transition-transform pixel-text-shadow"
        >
          CONFIRMAR MUTAÇÃO
        </button>
      </div>

    </div>
  );
}