# Decisiones Técnicas

> Documenta aquí las decisiones importantes que tomes durante el desarrollo.
> Esta documentación es parte de la evaluación.

## Información del Candidato

- **Nombre:** Germán Pérez Sánchez
- **Fecha:** 01/02/2026
- **Tiempo dedicado:** 10-12~

---

### OpenAI centralizado en AiService

**Contexto:** Inicialmente `KnowledgeService` tenía su propia lectura de `OPENAI_API_KEY` (vía `ConfigService`) y creaba su propio cliente de OpenAI para llamar a la API de embeddings. Así había dos sitios que cargaban la key y dos clientes OpenAI (uno en `AiService` para chat, otro en `KnowledgeService` para embeddings).

**Opciones consideradas:**
1. Mantener la situación actual: cada módulo (AI y Knowledge) con su propia key y cliente OpenAI.
2. Centralizar todo el uso de OpenAI en el módulo AI: `AiService` como único punto de lectura de la key y de creación del cliente; exponer `createEmbedding(text)` y que `KnowledgeService` inyecte `AiService` y lo use donde necesite embeddings.

**Decisión:** Opción 2. `AiService` es el único lugar que lee la API key y crea el cliente; expone `createEmbedding(text)` para embeddings. `KnowledgeService` deja de tener `ConfigService` y cliente OpenAI: inyecta `AiService` y llama directamente a `this.aiService.createEmbedding()` en `indexCourseContent` y `searchSimilar`, `KnowledgeModule` importa `AiModule` para poder inyectar `AiService`. DRY y responsabilidad clara. La api de text-embeding-small la usa el servicio que tiene los accessos para ello.

**Consecuencias:** Cualquier otro módulo que necesite uso de OpenAI en el futuro debe usar `AiService` no duplicar key ni cliente.

---

### Una sola función generateResponse (con RAG opcional) en lugar de generateResponse y generateResponseRAG

**Contexto:** Al principio la idea era tener dos funciones: `generateResponse(userMessage, history)` para chat básico y `generateResponseRAG(userMessage, history, relevantContext)` para cuando hubiera contexto RAG. La diferencia real entre ambos flujos es solo si se enriquece o no el system prompt con ese contexto; el resto (construcción de mensajes, llamada a OpenAI, manejo de errores, rate limiting, placeholder en fallback) es idéntico.

**Suposiciones:** Se asume que el usuario siempre querrá usar el chat enriquecido con contexto específico de sus cursos cuando sea posible; no tiene sentido ofrecer una opción explícita “con/sin contexto”. Si la respuesta va sin contexto es porque la búsqueda no encontró chunks relevantes (la pregunta no tiene que ver con el contenido del curso), no porque el usuario haya elegido no usar RAG.

**Opciones consideradas:**
1. **Dos funciones:** `generateResponse` y `generateResponseRAG` (o `generateResponseWithRAG`). El caller (p. ej. `ChatService`) decide cuál llamar según tenga o no contexto.
2. **Una función con parámetro opcional:** `generateResponse(userMessage, history, relevantContext?)`. Si `relevantContext` está presente y no vacío, se enriquece el system prompt; si no, se usa el prompt base. Un solo punto de entrada.

**Decisión:** Opción 2. Se mantiene una única función `generateResponse` con el tercer parámetro opcional `relevantContext?: string[]`. Dentro del método, `useRAG = relevantContext?.length > 0` y en ese caso se añade el bloque de contexto al system prompt; el resto del flujo (mensajes, `chat.completions.create`, errores, rate limit) es común. Así no se repite el mismo código idéntico en dos sitios; el caller solo llama a un mismo método y pasa el contexto cuando lo ha encontrado (RAG). Mejor mantenibilidad porque los cambios (modelo, temperatura, `max_tokens`, formato de mensajes) se hacen en un solo sitio. Es buena práctica cuando la variación entre “con RAG” y “sin RAG” se reduce a un enriquecimiento opcional del input; si en el futuro el flujo RAG divergiera mucho, tendría sentido extraer entonces.

**Consecuencias:** `ChatService` siempre llama a `this.aiService.generateResponse(message, history, relevantContext)` y puede pasar un array vacío o no buscar contexto; la decisión de usar RAG es solo “si hay contexto, se usa”. Cualquier mejora futura (retry, logging, métricas) se implementa una vez en `generateResponse`.

---

### Dos rutas REST para historial (conversaciones vs mensajes)

**Contexto:** El historial del chat puede devolver dos cosas: la lista de conversaciones del estudiante (sin mensajes) o los mensajes paginados de una conversación. En el servicio la lógica ya estaba separada en `getConversations(studentId)` y `getChatHistory(studentId, conversationId, page?, limit?)`; pero inicialmente el controller exponía un único endpoint `GET /chat/history/:studentId` con query opcional `conversationId`.

**Opciones consideradas:**
1. **Dos rutas:** `GET /chat/conversations/:studentId` y `GET /chat/conversations/:studentId/:conversationId/messages` (con query `page`, `limit`, `fromEnd`). Un recurso por URL, respuesta predecible, URLs autodescriptivas (REST).
2. **Un solo endpoint:** `GET /chat/history/:studentId?conversationId=...`; el mismo GET devuelve estructuras distintas según un query param (menos idiomático en REST).

**Decisión:** Opción 1. Se implementaron dos rutas: `GET /chat/conversations/:studentId` (lista de conversaciones) y `GET /chat/conversations/:studentId/:conversationId/messages` (mensajes paginados). El DELETE pasó a `DELETE /chat/conversations/:studentId/:conversationId` para mantener el mismo recurso. Cada endpoint del controller llama a su servicio: `getConversations(studentId)` y `getChatHistory(studentId, conversationId, page?, limit?, fromEnd?)`. El frontend (`api.getChatHistory`) sigue con la misma firma; internamente llama a una u otra URL según tenga o no `conversationId`.

**Consecuencias:** API alineada con REST (un recurso por URL). Swagger documenta cada operación con su respuesta. El front no cambia de contrato (misma función `getChatHistory`); solo cambian las URLs que usa por debajo.

---

### DTOs en todos los endpoints que reciben body o query

**Contexto:** En NestJS, los controladores de chat, knowledge y student exponen endpoints que reciben body (POST/PATCH) o query (GET). Algunos ya usaban DTOs con `class-validator` y `@nestjs/swagger` (p. ej. `SendMessageDto`, `IndexContentDto`, `SearchQueryDto`, `UpdatePreferencesDto`); otros tomaban parámetros sueltos con `@Body('campo')`, `@Query('page')`, etc. Sin DTO, la validación y la documentación en Swagger quedan repartidas o ausentes.

**Suposiciones:** Se asume que usar un DTO por endpoint que recibe input (body o query) es buena práctica: centraliza validación (tipos, rangos, obligatoriedad), documenta el contrato en Swagger y permite que el `ValidationPipe` global rechace peticiones inválidas antes de llegar al servicio.

**Opciones consideradas:**
1. **Solo DTOs donde ya existían:** Mantener parámetros sueltos en los endpoints que no tenían DTO (p. ej. body de “nueva conversación”, query de “mensajes paginados”, body de “index-from-pdf”).
2. **DTOs en todos los endpoints con body o query:** Añadir un DTO para cada endpoint que reciba body o query: validación y documentación en un solo sitio; el controller solo recibe el DTO y pasa sus campos al servicio.

**Decisión:** Opción 2. Se añadieron los DTOs que faltaban: en **chat**, `StartNewConversationDto` (body: `studentId`, `initialContext?`) y `GetMessagesQueryDto` (query: `page?`, `limit?`, `fromEnd?` con `@Type`/`@Transform` para números y booleano); en **knowledge**, `IndexFromPdfDto` (body part del multipart: `courseId`). Los endpoints que solo reciben path params (p. ej. `GET /conversations/:studentId`, `GET /students/:id/dashboard`) no tienen body ni query, por lo que no requieren DTO; el path se sigue recibiendo con `@Param()`. Así, todos los endpoints que reciben body o query usan un DTO; el `ValidationPipe` global valida y transforma; Swagger documenta los esquemas.

**Consecuencias:** Validación y contrato de la API centralizados en las carpetas `dto` de cada módulo. Cualquier nuevo endpoint que reciba body o query debería tener su DTO. Los path params (ids) se mantienen como `@Param('id')`; si en el futuro se quisiera validar IDs (p. ej. `IsMongoId`) de forma uniforme, podría añadirse un DTO de params o un pipe específico.

---

### chunkSources en metadata del mensaje asistente (feedback RAG en el chat)

**Contexto:** En `sendMessage`, el flujo RAG busca chunks similares con `KnowledgeService.searchSimilar`, obtiene el texto de cada chunk para el contexto del LLM y guarda la respuesta del asistente en MongoDB. Los chunks devueltos por `searchSimilar` incluyen `sourceFile` (nombre del PDF/origen del chunk). Surge la duda de si exponer esta información al frontend (para dar feedback al usuario y comprobar de forma visible que RAG se está usando) o dejarla solo en logs/backend.

**Suposiciones:** He supuesto que añadir `chunkSources` al metadata no sería un cambio grande (el schema ya contemplaba metadata flexible, el front podía mostrar una lista de fuentes) y que aportaría valor: debugging (ver de un vistazo si RAG devolvió resultados) y confianza al usuario (saber en qué documentos se basó la respuesta). No se pedía explícitamente en la prueba técnica; lo incorporé como mejora opcional.

**Opciones consideradas:**
1. **No exponer al front:** Mantener los orígenes de los chunks solo en logs del backend; el usuario no ve qué documentos se usaron en cada respuesta.
2. **Exponer en metadata del mensaje:** Guardar en el mensaje del asistente un resumen de fuentes (p. ej. agrupado por `sourceFile` con conteo) y devolverlo en la API para que el front muestre en el chat (p. ej. "(3) react-hooks.pdf, (1) mongodb-fundamentals.pdf").

**Decisión:** Opción 2. Se agrega `chunkSources` al `metadata` del mensaje del asistente. Tras `searchSimilar`, se agrupan los resultados por `sourceFile` y se construye un array `{ source: string; count: number }[]` (p. ej. `[{ source: 'react-hooks.pdf', count: 3 }, { source: 'mongodb-fundamentals.pdf', count: 1 }]`). Ese array se guarda en `metadata.chunkSources` del mensaje (solo si hay al menos un chunk). El schema de `ChatMessage` ya contempla `metadata.chunkSources`; los mensajes se devuelven con `metadata` en `getChatHistory` y en la respuesta de `sendMessage`. En el frontend, el componente `ChatMessage` recibe `chunkSources` desde `message.metadata?.chunkSources` y los muestra en el pie del mensaje del asistente (p. ej. "(3) react-hooks.pdf, (1) mongodb-fundamentals.pdf").

**Consecuencias:** El usuario ve en cada respuesta del bot qué documentos se han usado y cuántos chunks por documento, lo que refuerza la confianza y permite auditar que RAG está activo.

---

### Index-from-PDF en lugar de usar solo POST /index para indexar

**Contexto:** Ya existía un endpoint `POST /knowledge/index` que recibe en el body JSON `courseId` y `content` (texto plano) y llama a `indexCourseContent()` para dividir en chunks, generar embeddings y guardar en MongoDB. Para indexar un PDF hace falta antes extraer el texto. La duda era si reutilizar ese endpoint para el flujo “subir PDF → indexar” o crear uno nuevo.

**Suposiciones:** He supuesto que serán personas físicas (desde un panel de admin o el propio alumno) quienes "suban" los PDFs y los asignen al curso en cuestión. Al estar la prueba técnica más centrada en el backend, para poder probar todo el flujo sin depender de un front de subida, documenté en Swagger el endpoint con `multipart/form-data` (archivo + `courseId`) para poder usar Swagger: adjuntar el PDF y enviar el `courseId` directamente desde la UI de Swagger. Además, al tener la extracción de texto en el backend se podría usar con un cron, worker, integración con storage, etc. y podría automatizar la subida e indexación de PDFs sin cambiar el contrato del API. Simplemente estoy suponiendo; quizá tenga más sentido en el front con otros requisitos distintos, en cuyo caso se podría usar el endpoint ya existente de /index.

**Opciones consideradas:**
1. **Solo POST /index:** El cliente (script, otra herramienta o front) parsea el PDF, extrae el texto y envía `courseId` + `content` por JSON.
2. **Endpoint separado que procese .pdf a texto e indexe POST /index-from-pdf:** Mantener `/index` para “indexar contenido ya extraído” (JSON, ej: Añadir matices acerca de un curso o snippets utiles que el maestro quiera añadir y no se encuentren en sus pdfs de cursos) y añadir `/index-from-pdf` que recibe el PDF en multipart, lo valida, extrae el texto con `parsePdf()` y luego llama a `indexCourseContent()` (misma lógica de indexación).

**Decisión:** Opción 2. Se creó `POST /knowledge/index-from-pdf` que recibe `file` (PDF) y `courseId` en multipart/form-data, valida tipo y buffer, extrae el texto con `KnowledgeService.parsePdf(buffer)` y reutiliza `indexCourseContent(courseId, text, sourceFile)` para indexar. Justificación: separación de responsabilidades (el contrato de `/index` sigue siendo “texto listo”, sin mezclar con archivos ni MIME); evitar un único endpoint con dos modos (JSON vs multipart) y validaciones distintas; y que un cliente pueda subir el PDF directamente sin tener que parsearlo (p. ej. script o UI de “subir PDF”).

**Consecuencias:** La lógica de indexación sigue en un solo sitio (`indexCourseContent`); solo cambia el origen del texto (body JSON en `/index` o archivo en `/index-from-pdf`). Quien ya tenga el texto procesado y extraído sigue usando `/index`; quien tenga el PDF puede apuntar directamente a `/index-from-pdf`.

**Nota (archivo subido y validación):** El archivo subido se tipa con `UploadedFileDto` (`buffer`, `originalname`, `mimetype`, `size`): no es un DTO de validación con `class-validator`, porque Multer inyecta el objeto y no pasa por el `ValidationPipe`; sirve para tipado en TypeScript y documentación en Swagger. La validación de negocio (que exista archivo, que sea PDF, que exista `buffer`, que venga `courseId`) se hace en el controller porque Multer solo parsea el multipart y no aplica esas reglas (no valida MIME type ni obligatoriedad del archivo).

---

### Borrar chunks en el seed (delete en cascada al limpiar cursos)

**Contexto:** El script de seed (`apps/api/src/seeds/seed.ts`) limpia la base de datos antes de crear los datos de prueba. Los chunks de conocimiento (`KnowledgeChunk`) están asociados a cursos por `courseId`. Si solo se borraran los cursos, quedarían chunks huérfanos; además, al borrar cursos debería provocar borrado en cascada de sus chunks (no hay FK en NoSQL's databases, así que hay que hacerlo explícitamente).

**Opciones consideradas:**
1. **No borrar chunks en el seed:** Dejar que cada ejecución del seed borre solo Course, Student, etc.; Luego usar borrado manual con el endpoint existente de delete.
2. **Borrar chunks en el seed:** Incluir `KnowledgeChunk.deleteMany({})` en la fase de limpieza, antes de `Course.deleteMany({})`, para que al “resetear” cursos se eliminen también sus chunks (delete en cascada explícito).

**Decisión:** Opción 2. En el seed se añadió `KnowledgeChunk.deleteMany({})` en el bloque de limpieza, antes de `Course.deleteMany({})`, de modo que al borrar cursos no queden chunks huérfanos y se respete la idea de cascada (curso eliminado → sus chunks también).

**Consecuencias:** Cada ejecución del seed deja la colección de chunks vacía; si antes se habían indexado PDFs, tras el seed hay que volver a indexar a los nuevos cursos creados para que RAG tenga contenido.

---
### useDashboard: lógica del Dashboard en un hook (frontend)

**Contexto:** La página Dashboard (`apps/web/src/pages/Dashboard.tsx`) necesitaba datos de `getDashboard` y `getCourses` (TanStack Query) ademas de otra logica de obtencion de datos para implementacion de grafico de stats o de preferencias.

**Suposiciones:** Asumo que las estadísticas detalladas (`getStats`) y la actualización de preferencias (`updatePreferences`) tendrían sentido como funciones que usaría el dashboard (p. ej. gráfico de actividad con stats, selector de tema/idioma); por eso las he centralizado en el mismo hook y he separado la lógica del dashboard pero debido a la falta de tiempo y segun la prueba el FE es secundario, simplemente lo he organizado a falta de implementar la UI.

**Opciones consideradas:**
1. **Mantener useQuery inline en Dashboard:** Usar todas las queries en el page del dashboard.
2. **Centralizar en un hook useDashboard:** Un único hook que agrupa getDashboard, getCourses, getStats (query) y updatePreferences (mutación); el Dashboard solo llama a `useDashboard(studentId)` y consume `dashboard`, `courses`, `isLoading`, `error`, `refetch` (y en el futuro `stats`, `updatePreferences` para el chart y preferencias).

**Decisión:** Se creó `useDashboard(studentId)` en `apps/web/src/hooks/useDashboard.ts`: expone las queries de dashboard, courses y stats, y la mutación updatePreferences con invalidación de cache. El componente Dashboard pasa a usar solo `useDashboard(studentId)` y deja de tener lógica de TanStack Query inline. Se eliminaron los hooks sueltos `useStudentStats` y `useUpdatePreferences`. El Dashboard queda más limpio y preparado para añadir después el gráfico de actividad (usando `stats`) y la UI de preferencias (usando `updatePreferences`) sin tocar la estructura.

**Consecuencias:** Toda la lógica de datos del dashboard vive en un solo hook; el componente Dashboard se centra en presentación y estados de loading/error. Cualquier nueva feature del dashboard (chart, preferencias) puede apoyarse en los datos y acciones ya expuestos por `useDashboard`.


## Bug Encontrado

### Ubicación
- **Archivo:** `apps/api/src/modules/chat/chat.service.ts`
- **Línea(s):** 125-145
- **Método:** `startNewConversation`

### Descripción del Bug
Al iniciar una nueva conversación, el código reutiliza el historial en caché de una conversación anterior para “reutilizar estructura” y luego hace `history.length = 0` para dejarlo vacío. Como en JavaScript los arrays se pasan por **referencia**, `history` y el array guardado en `conversationCache` son el **mismo** objeto. Al hacer `history.length = 0` se está **vacando el array que sigue en la caché** de la conversación anterior. Efecto: la conversación anterior pierde su historial en caché; si el usuario vuelve a esa conversación, `getConversationHistory` devuelve un array vacío y la IA pierde el contexto de esa conversación.


### Causa Raíz
Asignar `history = cachedHistory || []` hace que `history` apunte al mismo array que está en el `Map` (referencia compartida). Cualquier mutación de `history` (p. ej. `history.length = 0` o `history.push(...)`) modifica también el array en caché. La intención era “empezar con historial vacío para la nueva conversación” sin tocar la caché de la anterior, pero al mutar el array compartido se corrompe la caché de la conversación previa.

### Solución Propuesta
```typescript
const history: MessageHistory[] = [];
```

### Cómo lo descubriste
Al revisar el código y la documentación de la prueba vi en `CLAUDE.md` que se mencionaba explícitamente un bug intencional en `startNewConversation` relacionado con mutación de arrays por referencia. A partir de ahí fui a la implementación de `ChatService.startNewConversation` y comprobé que se reutilizaba el array de `conversationCache` y luego se hacía `history.length = 0`, lo que confirma que se está vaciando también el historial cacheado de la conversación anterior. No llegué a reproducirlo manualmente en runtime porque el bug ya estaba señalado, pero sí validé el problema razonando sobre las referencias y proponiendo la corrección creando un nuevo array (`const history: MessageHistory[] = [];`) en lugar de mutar el existente.
---

## Suposiciones Realizadas (Las he añadido a cada decision técnica)

---

## Mejoras Futuras

Si tuviera más tiempo, implementaría:

1. Tareas pendientes "Should Have y nice to have": 
- **Streaming real de respuestas en el chat (SSE/WebSocket):** Reemplazar la respuesta “en bloque” por streaming token a token, exponiendo un endpoint `/chat/stream` y actualizando el front para mostrar el mensaje mientras se genera.
- **Completar la UI del Dashboard (gráfico y estados vacíos):** Implementar el gráfico de actividad semanal (chart.js/recharts trabajo dia a dia con estas librerias y lightweightcharts de trading view) usando `stats` de `useDashboard`, mejorar la sección de cursos recientes (scroll, empty states) y estados de loading/error más ricos.

2. **Hacer el frontend completamente responsive:** Adaptar el layout, cards y tipografía para móviles y tablets (breakpoints, grids flexibles, ocultar/compactar secciones secundarias) para que el dashboard y el chat funcionen bien en pantallas de todos los tamaños.

3. **Afinar dependencias**: Revisar que cada app (API, web) importe solo las dependencias que realmente necesita (evitar paquetes “globales” en package.json que solo usa una parte) para reducir peso y superficie. 

4. **Ordenar tipos segun contexto**: Centralizar interfaces y tipos donde tenga sentido: libs/shared para modelos de dominio y contratos de API reutilizables (lo que realmente viaja entre backend y frontend), apps/web para tipos puramente de UI (view models, estados de componentes, formatos ya transformados) y apps/api para detalles internos de backend (DTOs, tipos de persistencia); eliminar duplicados y mapear explícitamente entre “tipo de dominio” y “tipo de vista” cuando haga falta.

5. **Pulir detalles de UX en el flujo de chat:** Ya añadí una pequeña mejora para que, al enviar un mensaje y recibir respuesta, el input no pierda el foco. Se podrían añadir más micro-mejoras en esa línea: ej que al seleccionar una nueva conversación el input reciba foco automáticamente.

6. **Autenticación y autorización reales:** Añadir autenticación (por ejemplo JWT). Autorización básica para garantizar que cada estudiante solo pueda acceder a sus propios cursos, progreso y conversaciones. Esto alinearía mejor la API con un escenario real de producción.

7. **Optimización y resiliencia del flujo RAG:** Mejorar el pipeline de RAG añadiendo cacheo de embeddings o resultados frecuentes, índices adecuados en MongoDB para consultas de chunks y conversaciones, y mecanismos de resiliencia (reintentos con backoff y circuit breaker) ante fallos o rate limiting de la API de OpenAI.

---

## Dificultades Encontradas

### Dificultad 1: Falta de familiaridad con Jest para unit tests

- **Problema:** No estoy muy familiarizado con Jest para pruebas unitarias en TypeScript/NestJS. Suelo escribir más pruebas end-to-end con Playwright y pruebas de backend con `pytest`.
- **Solución:** Revisar rápidamente la documentación de Jest para un entendimiento rapido de como funciona. Para esta parte me apoyé bastante en una IA como asistente, combinando sus sugerencias con una lectura rápida sobre cómo Jest intercepta módulos y mocks de dependencias. A partir de ahí fui añadiendo tests incrementales.
- **Tiempo invertido:** 1h en coger confianza con Jest y su forma de mockear dependencias.

---

### Dificultad 2: pdf-parse y el build con webpack

- **Problema:** La API usa `pdf-parse` para extraer texto de PDFs al indexar contenido (RAG). Al construir con webpack, el build fallaba: no podía compilar/empaquetar `pdf-parse`. La librería está pensada para Node.js (usa `fs`, buffers, posibles requires dinámicos) y webpack no puede analizarla ni empaquetarla bien, lo que genera errores de build o de runtime.
- **Solución:** Añadir `pdf-parse` a `externals` en `apps/api/webpack.config.js`. Así webpack no la incluye en el bundle; en tiempo de ejecución Node resuelve `require('pdf-parse')` desde `node_modules`. Solucion habitual para dependencias no "webpack-friendly" en un backend empaquetado con webpack.
- **Tiempo invertido:** 20 min.

---