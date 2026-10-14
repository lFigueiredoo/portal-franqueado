# Motion Guide — Portal PHIQ

O motion deve parecer sofisticado, não chamativo.

- Hover/press: 180–280 ms
- Cards: 280–380 ms
- Entrada de tela: 450–650 ms
- Progressos: 850–1100 ms
- Idle decorativo: 2.5–6 s
- Easing principal: cubic-bezier(.22,1,.36,1)

## Conquistas

- Entrada em cascata
- Leve tilt 3D no hover
- Reflexo passando sobre a moeda
- Glow/sombra dinâmica
- Bloqueadas em escala de cinza + cadeado
- Evitar rotação completa ou bounce exagerado

## Acessibilidade

Todos os loops e transições fortes são anulados com `prefers-reduced-motion`.
