# Scaffold Notes

Este scaffold não pretende substituir o código jogável principal do repositório. Ele existe para orientar integração incremental dos sistemas do Baixo Sul.

## Módulos sugeridos
- `BaixoSulMapScene.js` → seleção de regiões, navegação global e leitura do estado do mundo
- `ItuberaBattleScene.js` → primeiro vertical slice completo
- `WeatherAndTideSystem.js` → clima, maré e hazards costeiros
- `NPCDirectorSystem.js` → civis, pânico, rotina, evacuação e tropas
- `MonsterLoadoutSystem.js` → armas monstruosas, props, mutações e builds

## Integração segura
1. manter qualquer build atual intacta
2. plugar estes módulos por feature flag ou cena de debug
3. validar vertical slice de Ituberá antes de espalhar para outras cidades
