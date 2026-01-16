# Datos de Cursos

Esta carpeta contiene los PDFs con el contenido de los cursos para el sistema RAG.

## Archivos

```
courses/
├── javascript-fundamentals.pdf
├── react-hooks.pdf
└── nodejs-express.pdf
```

## Uso

El candidato debe implementar la extraccion de texto de estos PDFs e indexarlos en el sistema de conocimiento.

**Sugerencias de librerias para extraer texto de PDF:**
- `pdf-parse` - Simple y ligera
- `pdfjs-dist` - Mas completa (Mozilla)

## Ejemplo de uso esperado

```bash
# 1. Extraer texto del PDF (el candidato implementa esto)
# 2. Llamar al endpoint de indexacion:

curl -X POST http://localhost:3333/api/knowledge/index \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "...",
    "content": "Texto extraido del PDF...",
    "sourceFile": "javascript-fundamentals.pdf"
  }'

# 3. Buscar contenido relevante:

curl "http://localhost:3333/api/knowledge/search?q=que%20es%20una%20closure"
```
