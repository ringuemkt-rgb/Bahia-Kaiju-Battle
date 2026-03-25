import { useLocation } from "wouter";
import mapBg from "../assets/map_bahia.png";
import { useState } from "react";

const CITIES = [
  { id: "salvador", name: "Salvador", x: "80%", y: "30%", unlocked: true, details: "Capital, Elevador Lacerda" },
  { id: "feira", name: "Feira de Santana", x: "65%", y: "25%", unlocked: true, details: "Princesa do Sertão" },
  { id: "itacare", name: "Itacaré", x: "85%", y: "70%", unlocked: true, details: "Praia da Concha, Mata Atlântica" },
  { id: "valenca", name: "Valença", x: "78%", y: "55%", unlocked: true, details: "Mercado do Peixe, Porto" },
  { id: "camamu", name: "Camamu", x: "82%", y: "65%", unlocked: true, details: "Cidade Histórica, Baía" },
  { id: "itubera", name: "Ituberá", x: "80%", y: "60%", unlocked: true, details: "Cachoeira Pancada Grande" },
  { id: "morro", name: "Morro de São Paulo", x: "88%", y: "50%", unlocked: true, details: "Farol, Turismo" },
];

export default function Map() {
  const [, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  return (
    <div className="relative w-full h-screen bg-[#4a7a8c] overflow-hidden flex items-center justify-center pixelated-render">
      {/* Map Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${mapBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.8
        }}
      />
      
      <div className="scanlines z-50 pointer-events-none" />

      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={() => setLocation('/')}
          className="bg-black/80 text-white font-sans text-xl p-2 border-2 border-white pixel-text-shadow hover:bg-black"
        >
          &lt; VOLTAR
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20 bg-black/80 p-2 border-2 border-white">
        <h2 className="text-accent font-display text-sm md:text-base pixel-text-shadow">
          MAPA: COLOSSOS DO BAIXO SUL
        </h2>
      </div>

      {/* City Nodes */}
      <div className="relative w-full max-w-3xl aspect-square z-10">
        {CITIES.map((city) => (
          <div
            key={city.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: city.x, top: city.y }}
            onClick={() => setSelectedCity(city.id)}
          >
            {/* Node visual */}
            <div className={`
              w-4 h-4 md:w-6 md:h-6 rounded-full border-2 md:border-4 
              ${city.unlocked ? 'bg-primary border-white animate-pulse' : 'bg-gray-600 border-gray-400'}
              ${selectedCity === city.id ? 'ring-4 ring-accent scale-150 transition-transform' : ''}
              shadow-[0_0_10px_rgba(0,0,0,0.8)]
            `} />
            
            {/* Label */}
            <div className={`
              absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap
              font-sans text-lg md:text-xl text-white pixel-text-shadow bg-black/50 px-2 rounded
              ${city.unlocked ? '' : 'opacity-50'}
              ${selectedCity === city.id ? 'text-accent' : ''}
            `}>
              {city.name}
            </div>
          </div>
        ))}
      </div>

      {/* Selection Modal */}
      {selectedCity && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md">
          {CITIES.filter(c => c.id === selectedCity).map(city => (
            <div key="modal" className="bg-black/90 border-4 border-white p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-display text-white pixel-text-shadow mb-2">
                  {city.name}
                </h3>
                <p className="text-muted-foreground font-sans text-xl">
                  {city.details}
                </p>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-accent font-sans text-xl animate-pulse">
                  ALERTA DE KAIJU
                </span>
                
                <button
                  onClick={() => city.unlocked ? setLocation(`/level/${city.id}`) : null}
                  className={`
                    px-4 py-2 font-display text-sm md:text-base border-2 pixel-text-shadow
                    ${city.unlocked 
                      ? 'bg-primary border-white text-white hover:bg-primary/80 active:scale-95' 
                      : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}
                  `}
                >
                  {city.unlocked ? "INVADIR" : "???"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}