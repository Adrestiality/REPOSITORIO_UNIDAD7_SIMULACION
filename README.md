# ACV · Word as a Playable System (Unidad 7 · Simulación)

Sistema tipográfico interactivo en 2D basado en la identidad de **ACV (Agnostic Consulting Value)**, una consultora estratégica enfocada en Transformación Digital e Innovación.

---

## 🎯 Concepto y Niveles

El juego traduce el flujo de trabajo de la consultora en 3 niveles abstractos y minimalistas sin tutoriales textuales invasivos (aprendizaje cognitivo por descubrimiento interactivo):

1. **Letra A (`Agnostic` - La Mentalidad)**:
   - *Narrativa*: Superar la rigidez de atarse a un solo proveedor o tecnología. Entender la necesidad abre un abanico de posibilidades.
   - *Mecánica*: Manipular el prisma/travesaño de la letra "A" para refractar el haz de entrada en un espectro armónico hacia los receptores de la base.

2. **Letra C (`Consulting` - Análisis y Filtrado)**:
   - *Narrativa*: Filtrar y clasificar el caos de problemas del cliente hacia *Transformación Digital* o *Innovación*.
   - *Mecánica*: Rotar el lente de la letra "C" y su campo magnético/centrífugo para clasificar las partículas caóticas en dos corrientes orbitales armónicas.

3. **Letra V (`Value` - Articulación de Red)**:
   - *Narrativa*: La consultora entrega el diagnóstico y orquesta una red de aliados expertos para concentrar el valor en el vértice final.
   - *Mecánica*: Posicionar los nodos de aliados expertos dentro del embudo de la "V" para redirigir y concentrar los pulsos hacia el vértice de entrega de valor.

---

## 🏗️ Arquitectura Modular del Repositorio

El proyecto está diseñado de forma desacoplada para que cada nivel funcione y se edite en su propio módulo aislado:

```
/
├── index.html            <- Contenedor principal, layout y HUD de navegación
├── style.css             <- Sistema de diseño monocromático, canvas y animaciones
├── main.js               <- Game Manager (máquina de estados, sintetizador de audio y transiciones)
├── lib/                  <- Documentación y dependencias de simulación (Matter.js, p5.js)
├── level-A/              <- CARPETA AISLADA NIVEL 1
│   ├── levelA.js         <- Renderizado visual, eventos e integración de la letra A
│   └── physicsA.js       <- Simulación de resorte, prisma óptico y receptores
├── level-C/              <- CARPETA AISLADA NIVEL 2
│   ├── levelC.js         <- Renderizado visual, apertura y orbitales de la letra C
│   └── physicsC.js       <- Filtrado centrífugo y clasificación de partículas
└── level-V/              <- CARPETA AISLADA NIVEL 3
    ├── levelV.js         <- Renderizado visual, constelación y rebote de la letra V
    └── physicsV.js       <- Simulación de red de aliados, colisiones y embudo de valor
```

---

## 🚀 Puesta en Marcha y Desarrollo

### Requisitos
- Node.js 20+ o 22+

### Instalación
```bash
npm install
```

### Ejecutar Servidor Local
```bash
npm run dev
```

### Compilar para Producción
```bash
npm run build
npm run preview
```

---

## 🎮 Controles

- **Mouse / Touch (Arrastrar / Clic)**: Interactuar directamente con el sistema físico de cada letra.
- **Teclas `1`, `2`, `3`**: Cambiar directamente entre los niveles A, C y V.
- **Tecla `R`**: Reiniciar el nivel actual.
- **Barra Espaciadora**: Continuar al siguiente nivel al completar una etapa.
- **Botones de la barra superior**: Seleccionar nivel, silenciar audio táctil o reiniciar.
