# Rúbrica de Evaluación

Esta rúbrica describe los criterios con los que evaluaremos tu prueba técnica.

## Puntuación Total: 100 puntos

---

## 1. Funcionalidad (40 puntos)

### Backend (25 puntos)

| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| Endpoints Student | 4 | `stats` y `preferences` funcionan correctamente |
| Endpoints Chat | 4 | `history` y `delete` implementados con paginación |
| Integración OpenAI | 4 | Llamadas correctas a la API, manejo de errores |
| **Sistema RAG** | 10 | Embeddings, indexación, búsqueda semántica, integración en chat |
| Streaming | 3 | SSE o WebSocket funcional (Should Have) |

### Frontend (15 puntos)

| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| Dashboard funcional | 4 | Cards, estados de loading/error |
| Chat funcional | 6 | Envío, recepción, historial |
| UX/Estados | 3 | Loading, errores, empty states |
| Gráfico actividad | 2 | Nice to have |

---

## 2. Calidad de Código (25 puntos)

| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| Legibilidad | 5 | Código claro, bien nombrado |
| Organización | 5 | Estructura coherente, separación de responsabilidades |
| TypeScript | 5 | Tipos bien definidos, sin `any` innecesarios |
| Patrones | 5 | Uso correcto de patrones de React y NestJS |
| Error handling | 5 | Manejo robusto de errores |

---

## 3. Testing (15 puntos)

| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| Tests implementados | 5 | Los `it.todo()` completados |
| Cobertura lógica | 5 | Tests cubren casos importantes |
| Tests adicionales | 5 | Tests extra que añadan valor |

---

## 4. Debugging (10 puntos)

| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| Bug encontrado | 4 | Identificó el bug correctamente |
| Explicación | 3 | Entiende la causa raíz |
| Solución | 3 | Propone una solución correcta |

---

## 5. Documentación (10 puntos)

| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| DECISIONS.md | 5 | Decisiones bien documentadas |
| Código comentado | 3 | Comentarios útiles donde necesario |
| README updates | 2 | Actualizaciones relevantes |

---

## Bonus (hasta +10 puntos extra)

- **Accesibilidad (a11y):** +3 puntos
- **Optimización de rendimiento:** +2 puntos
- **Animaciones pulidas:** +2 puntos
- **Tests E2E:** +3 puntos

---

## Criterios de Descalificación

- Código copiado sin atribución
- No funciona en absoluto
- Plagio de otras pruebas técnicas

---

## Niveles de Evaluación

| Puntuación | Nivel |
|------------|-------|
| 90-100+ | Excepcional |
| 75-89 | Muy bueno |
| 60-74 | Bueno |
| 45-59 | Aceptable |
| < 45 | No apto |

---

## Notas para el Candidato

- **Prioriza funcionalidad:** Es mejor tener features completas que muchas a medias
- **Documenta trade-offs:** Si debes elegir, explica por qué
- **Muestra tu proceso:** Los comentarios sobre decisiones suman puntos
- **Pregunta si no está claro:** Las suposiciones razonables son válidas

Good luck!
