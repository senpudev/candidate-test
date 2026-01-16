# Guía para Entrevistadores

> **CONFIDENCIAL** - Este documento es solo para uso interno del equipo de evaluación.

## Resumen de la Prueba

Esta prueba evalúa las habilidades del candidato en:
- Desarrollo fullstack (NestJS + React)
- Integración con APIs externas (OpenAI)
- Debugging y resolución de problemas
- Testing y documentación

---

## Bug Intencional

### Ubicación Exacta
- **Archivo:** `apps/api/src/modules/chat/chat.service.ts`
- **Método:** `startNewConversation()`
- **Líneas:** 73-89 (aproximadamente)

### Descripción del Bug

El método `startNewConversation` tiene un bug donde el historial de mensajes se pasa **por referencia** en lugar de crear una copia. Esto causa que cuando se "limpia" el historial para la nueva conversación, también se borra el historial de la conversación anterior que estaba en el cache.

### Código con Bug

```typescript
// BUG: Asignación por referencia
const cachedHistory = this.conversationCache.get(prevId);
history = cachedHistory || [];
history.length = 0; // Esto afecta al cache original!
```

### Solución Correcta

```typescript
// CORRECTO: Crear una copia del array
const cachedHistory = this.conversationCache.get(prevId);
history = cachedHistory ? [...cachedHistory] : [];
history.length = 0; // Ahora solo afecta a la copia
```

### Cómo Debería Descubrirlo el Candidato

1. **Al escribir tests:** Un test que verifique que el historial de conversaciones anteriores no se modifica debería fallar
2. **Al probar manualmente:** Iniciar varias conversaciones y ver que el historial de las anteriores desaparece
3. **Al revisar el código:** Notar la asignación directa sin spread operator

---

## Preguntas de Follow-up

### Sobre el Bug

1. "Explícame cómo encontraste el bug"
2. "¿Qué otras formas de inmutabilidad conoces en JavaScript?"
3. "¿Cómo prevendrías este tipo de bugs en el futuro?"

### Sobre Arquitectura

1. "¿Por qué elegiste SSE/WebSocket para el streaming?"
2. "¿Cómo escalarías este sistema para 10,000 usuarios concurrentes?"
3. "¿Qué cambiarías si tuvieras que añadir autenticación?"

### Sobre Testing

1. "¿Qué casos edge no cubriste y por qué?"
2. "¿Cómo testearías el streaming de forma automatizada?"
3. "¿Qué herramientas usarías para tests E2E?"

### Sobre OpenAI

1. "¿Cómo manejarías rate limiting de OpenAI?"
2. "¿Qué estrategia usarías para reducir costos de tokens?"
3. "¿Cómo implementarías fallback si OpenAI está caído?"

---

## Checklist de Evaluación

### Funcionalidad
- [ ] Dashboard carga correctamente
- [ ] Chat envía y recibe mensajes
- [ ] Streaming funciona (si implementado)
- [ ] Endpoints backend funcionan
- [ ] Seeds funcionan correctamente

### Calidad
- [ ] Código limpio y organizado
- [ ] TypeScript bien utilizado
- [ ] Manejo de errores presente
- [ ] Sin memory leaks obvios

### Testing
- [ ] Tests `it.todo()` completados
- [ ] Tests pasan sin errores
- [ ] Cobertura razonable

### Debugging
- [ ] Bug encontrado
- [ ] Solución correcta
- [ ] Explicación clara

### Documentación
- [ ] DECISIONS.md completo
- [ ] Decisiones bien justificadas
- [ ] Suposiciones documentadas

---

## Red Flags

Señales de alerta durante la evaluación:

- **Copy-paste masivo** sin entender el código
- **No encuentra el bug** después de mucho tiempo
- **Tests que no testean nada** real
- **Código que no compila** o tiene errores básicos
- **Falta de manejo de errores** completa
- **TypeScript deshabilitado** o lleno de `any`

---

## Green Flags

Señales positivas:

- **Encuentra el bug rápidamente** y explica bien
- **Tests thoughtful** que cubren edge cases
- **Documentación clara** y honesta sobre trade-offs
- **Código idiomático** de React y NestJS
- **Pregunta sobre requisitos** ambiguos en lugar de asumir
- **Implementa features extra** de forma elegante

---

## Scoring Guide

### 90-100: Contratación Inmediata
- Todo funciona
- Bug encontrado y explicado perfectamente
- Tests completos
- Documentación excelente
- Código de calidad senior

### 75-89: Recomendado
- Mayoría funciona
- Bug encontrado
- Tests razonables
- Buena documentación
- Código limpio

### 60-74: Considerar
- Funcionalidades básicas completas
- Bug parcialmente encontrado
- Algunos tests
- Documentación básica

### <60: No Apto
- Features incompletas
- Bug no encontrado
- Tests mínimos o ausentes
- Sin documentación

---

## Notas del Evaluador

> Espacio para notas durante la revisión

**Candidato:** _______________
**Fecha:** _______________
**Evaluador:** _______________

### Observaciones:

```
[Espacio para notas]
```

### Puntuación Final: ___ / 100

### Recomendación: [ ] Contratar  [ ] Segunda entrevista  [ ] No avanzar
