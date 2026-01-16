/**
 * Script para generar PDFs de cursos de ejemplo
 * Ejecutar: npx ts-node scripts/generate-course-pdfs.ts
 */

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'courses');

// Asegurar que el directorio existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createPDF(filename: string, title: string, sections: { heading: string; content: string }[]) {
  const doc = new PDFDocument({ margin: 50 });
  const outputPath = path.join(OUTPUT_DIR, filename);

  doc.pipe(fs.createWriteStream(outputPath));

  // Título principal
  doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(2);

  // Secciones
  for (const section of sections) {
    doc.fontSize(16).font('Helvetica-Bold').text(section.heading);
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(section.content, { align: 'justify' });
    doc.moveDown(1.5);
  }

  doc.end();
  console.log(`✅ Generado: ${outputPath}`);
}

// ============================================
// CURSO 1: JavaScript Fundamentals
// ============================================
const javascriptContent = [
  {
    heading: '1. Variables y Tipos de Datos',
    content: `JavaScript es un lenguaje de tipado dinámico que soporta varios tipos de datos primitivos y objetos.

Los tipos primitivos incluyen: string (cadenas de texto), number (números enteros y decimales), boolean (true/false), null, undefined, symbol y bigint.

Para declarar variables usamos tres palabras clave:
- var: tiene scope de función y permite redeclaración (uso legacy, evitar)
- let: tiene scope de bloque, permite reasignación pero no redeclaración
- const: tiene scope de bloque, no permite reasignación ni redeclaración

Ejemplo:
const nombre = "María";
let edad = 25;
let activo = true;

Las constantes deben inicializarse al declararse y su valor no puede cambiar. Sin embargo, si la constante es un objeto o array, sus propiedades internas sí pueden modificarse.`
  },
  {
    heading: '2. Funciones',
    content: `Las funciones en JavaScript pueden declararse de varias formas:

Declaración de función (function declaration):
function sumar(a, b) {
  return a + b;
}

Expresión de función (function expression):
const restar = function(a, b) {
  return a - b;
};

Funciones flecha (arrow functions):
const multiplicar = (a, b) => a * b;
const dividir = (a, b) => {
  if (b === 0) throw new Error("División por cero");
  return a / b;
};

Las funciones flecha no tienen su propio 'this', lo heredan del contexto léxico donde fueron creadas. Esto las hace ideales para callbacks y métodos de arrays.

Los parámetros pueden tener valores por defecto:
function saludar(nombre = "Invitado") {
  return "Hola, " + nombre;
}

También existe el operador rest (...) para recibir múltiples argumentos:
function sumarTodos(...numeros) {
  return numeros.reduce((acc, n) => acc + n, 0);
}`
  },
  {
    heading: '3. Arrays y Métodos de Array',
    content: `Los arrays en JavaScript son colecciones ordenadas que pueden contener cualquier tipo de dato.

Creación:
const frutas = ["manzana", "banana", "naranja"];
const numeros = new Array(1, 2, 3, 4, 5);

Métodos importantes para transformación (no mutan el original):
- map(): transforma cada elemento
  const dobles = numeros.map(n => n * 2); // [2, 4, 6, 8, 10]

- filter(): filtra elementos según condición
  const pares = numeros.filter(n => n % 2 === 0); // [2, 4]

- reduce(): reduce a un único valor
  const suma = numeros.reduce((acc, n) => acc + n, 0); // 15

- find(): encuentra el primer elemento que cumple condición
  const mayor3 = numeros.find(n => n > 3); // 4

- some(): verifica si algún elemento cumple condición
  const hayPares = numeros.some(n => n % 2 === 0); // true

- every(): verifica si todos cumplen condición
  const todosPares = numeros.every(n => n % 2 === 0); // false

Métodos que mutan el array original:
- push(): añade al final
- pop(): elimina del final
- shift(): elimina del inicio
- unshift(): añade al inicio
- splice(): añade/elimina en posición específica
- sort(): ordena (¡cuidado con números!)

Para ordenar números correctamente:
numeros.sort((a, b) => a - b); // ascendente
numeros.sort((a, b) => b - a); // descendente`
  },
  {
    heading: '4. Objetos y Desestructuración',
    content: `Los objetos son colecciones de pares clave-valor que representan entidades.

Creación de objetos:
const usuario = {
  nombre: "Ana",
  edad: 28,
  email: "ana@ejemplo.com",
  direccion: {
    ciudad: "Madrid",
    pais: "España"
  }
};

Acceso a propiedades:
console.log(usuario.nombre); // "Ana"
console.log(usuario["edad"]); // 28

Desestructuración de objetos:
const { nombre, edad } = usuario;
const { direccion: { ciudad } } = usuario; // desestructuración anidada

Desestructuración con alias:
const { nombre: nombreUsuario } = usuario;

Desestructuración con valores por defecto:
const { telefono = "No disponible" } = usuario;

Spread operator para copiar/combinar objetos:
const usuarioActualizado = { ...usuario, edad: 29 };
const completo = { ...usuario, ...datosAdicionales };

Object methods útiles:
- Object.keys(obj): array de claves
- Object.values(obj): array de valores
- Object.entries(obj): array de pares [clave, valor]
- Object.assign(target, source): copia propiedades`
  },
  {
    heading: '5. Programación Asíncrona',
    content: `JavaScript maneja operaciones asíncronas mediante callbacks, Promises y async/await.

Callbacks (patrón antiguo):
function obtenerDatos(callback) {
  setTimeout(() => {
    callback(null, { data: "resultado" });
  }, 1000);
}

Promises (ES6):
const promesa = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve({ data: "resultado" });
  }, 1000);
});

promesa
  .then(resultado => console.log(resultado))
  .catch(error => console.error(error));

Async/Await (ES2017):
async function obtenerUsuario(id) {
  try {
    const respuesta = await fetch("/api/usuarios/" + id);
    const usuario = await respuesta.json();
    return usuario;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

Ejecución paralela con Promise.all():
async function obtenerTodo() {
  const [usuarios, productos] = await Promise.all([
    fetch("/api/usuarios").then(r => r.json()),
    fetch("/api/productos").then(r => r.json())
  ]);
  return { usuarios, productos };
}

Promise.allSettled() espera a que todas terminen sin importar si fallan:
const resultados = await Promise.allSettled([promesa1, promesa2, promesa3]);`
  },
  {
    heading: '6. Manejo de Errores',
    content: `El manejo correcto de errores es fundamental para aplicaciones robustas.

Try-catch básico:
try {
  const resultado = operacionRiesgosa();
  console.log(resultado);
} catch (error) {
  console.error("Ocurrió un error:", error.message);
} finally {
  // Se ejecuta siempre, haya error o no
  limpiarRecursos();
}

Crear errores personalizados:
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function validarEdad(edad) {
  if (edad < 0 || edad > 150) {
    throw new ValidationError("Edad inválida: " + edad);
  }
  return true;
}

Manejo de errores en async/await:
async function procesarDatos() {
  try {
    const datos = await obtenerDatos();
    return transformar(datos);
  } catch (error) {
    if (error instanceof NetworkError) {
      // Reintentar
      return await procesarDatos();
    }
    throw error; // Re-lanzar otros errores
  }
}

Es importante siempre manejar los errores en Promises:
promesa
  .then(resultado => procesar(resultado))
  .catch(error => manejarError(error)); // ¡No olvidar!`
  }
];

createPDF('javascript-fundamentals.pdf', 'JavaScript: Fundamentos del Lenguaje', javascriptContent);

// ============================================
// CURSO 2: React Hooks y Estado
// ============================================
const reactContent = [
  {
    heading: '1. Introducción a los Hooks',
    content: `Los Hooks fueron introducidos en React 16.8 y permiten usar estado y otras características de React sin escribir clases.

Reglas de los Hooks:
1. Solo llamar Hooks en el nivel superior (no dentro de loops, condiciones o funciones anidadas)
2. Solo llamar Hooks desde componentes funcionales de React o desde otros Hooks personalizados

Los Hooks principales son:
- useState: para manejar estado local
- useEffect: para efectos secundarios
- useContext: para consumir contexto
- useReducer: para estado complejo
- useCallback: para memorizar funciones
- useMemo: para memorizar valores computados
- useRef: para referencias mutables

Ejemplo básico de componente con Hooks:
function Contador() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicks: {count}
    </button>
  );
}`
  },
  {
    heading: '2. useState en Profundidad',
    content: `useState es el Hook más básico para manejar estado en componentes funcionales.

Sintaxis:
const [estado, setEstado] = useState(valorInicial);

El valor inicial puede ser cualquier tipo de dato:
const [nombre, setNombre] = useState("");
const [edad, setEdad] = useState(0);
const [activo, setActivo] = useState(true);
const [usuario, setUsuario] = useState({ nombre: "", email: "" });
const [items, setItems] = useState([]);

Actualización funcional (cuando el nuevo valor depende del anterior):
setCount(prevCount => prevCount + 1);

Esto es importante cuando se hacen múltiples actualizaciones:
// Incorrecto - solo incrementa 1
setCount(count + 1);
setCount(count + 1);

// Correcto - incrementa 2
setCount(prev => prev + 1);
setCount(prev => prev + 1);

Para objetos, siempre crear nuevo objeto (inmutabilidad):
setUsuario({ ...usuario, nombre: "Nuevo nombre" });

Para arrays:
// Añadir
setItems([...items, nuevoItem]);
// Eliminar
setItems(items.filter(item => item.id !== idAEliminar));
// Actualizar
setItems(items.map(item =>
  item.id === id ? { ...item, completado: true } : item
));

Inicialización perezosa (lazy initialization):
const [datos, setDatos] = useState(() => {
  // Solo se ejecuta en el primer render
  return calcularValorInicial();
});`
  },
  {
    heading: '3. useEffect para Efectos Secundarios',
    content: `useEffect permite ejecutar efectos secundarios en componentes funcionales: llamadas API, suscripciones, manipulación del DOM, etc.

Sintaxis:
useEffect(() => {
  // Código del efecto
  return () => {
    // Cleanup (opcional)
  };
}, [dependencias]);

Casos de uso según dependencias:

1. Sin array de dependencias - se ejecuta en cada render:
useEffect(() => {
  console.log("Cada render");
});

2. Array vacío - solo en el montaje:
useEffect(() => {
  console.log("Solo al montar");
  return () => console.log("Al desmontar");
}, []);

3. Con dependencias - cuando cambian:
useEffect(() => {
  console.log("userId cambió:", userId);
  fetchUserData(userId);
}, [userId]);

Ejemplo práctico - fetch de datos:
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch("/api/users/" + userId);
        const data = await response.json();
        if (!cancelled) {
          setUser(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true; // Evita actualizaciones después de desmontar
    };
  }, [userId]);

  if (loading) return <div>Cargando...</div>;
  return <div>{user.name}</div>;
}`
  },
  {
    heading: '4. useContext para Estado Global',
    content: `useContext permite consumir contexto sin necesidad de render props o Consumer.

Crear el contexto:
const ThemeContext = React.createContext("light");

Proveer el contexto:
function App() {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <MainContent />
    </ThemeContext.Provider>
  );
}

Consumir el contexto con useContext:
function Button() {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <button
      style={{ background: theme === "dark" ? "#333" : "#fff" }}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      Toggle Theme
    </button>
  );
}

Patrón recomendado - crear un hook personalizado:
// ThemeContext.js
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return context;
}

// Uso en componentes
function MiComponente() {
  const { theme, toggleTheme } = useTheme();
  // ...
}`
  },
  {
    heading: '5. useReducer para Estado Complejo',
    content: `useReducer es preferible a useState cuando la lógica de estado es compleja o cuando el siguiente estado depende del anterior.

Sintaxis:
const [state, dispatch] = useReducer(reducer, initialState);

Ejemplo - carrito de compras:
const initialState = {
  items: [],
  total: 0
};

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM":
      return {
        ...state,
        items: [...state.items, action.payload],
        total: state.total + action.payload.price
      };
    case "REMOVE_ITEM":
      const item = state.items.find(i => i.id === action.payload);
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload),
        total: state.total - (item?.price || 0)
      };
    case "CLEAR_CART":
      return initialState;
    default:
      return state;
  }
}

function ShoppingCart() {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  };

  const removeItem = (id) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
  };

  return (
    <div>
      <p>Total: {state.total}</p>
      {state.items.map(item => (
        <div key={item.id}>
          {item.name} - {item.price}
          <button onClick={() => removeItem(item.id)}>Eliminar</button>
        </div>
      ))}
    </div>
  );
}

useReducer es especialmente útil cuando se combina con Context para crear un store global similar a Redux pero sin dependencias externas.`
  },
  {
    heading: '6. Hooks de Optimización: useMemo y useCallback',
    content: `Estos hooks ayudan a optimizar el rendimiento evitando cálculos o recreaciones innecesarias.

useMemo - memoriza valores computados:
const valorMemoizado = useMemo(() => {
  return calcularValorCostoso(a, b);
}, [a, b]); // Solo recalcula si a o b cambian

Ejemplo práctico:
function ListaFiltrada({ items, filtro }) {
  const itemsFiltrados = useMemo(() => {
    console.log("Filtrando..."); // Solo cuando items o filtro cambian
    return items.filter(item =>
      item.nombre.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [items, filtro]);

  return (
    <ul>
      {itemsFiltrados.map(item => <li key={item.id}>{item.nombre}</li>)}
    </ul>
  );
}

useCallback - memoriza funciones:
const funcionMemoizada = useCallback(() => {
  hacerAlgo(a, b);
}, [a, b]);

Es útil cuando pasas callbacks a componentes hijos optimizados:
function Padre() {
  const [count, setCount] = useState(0);

  // Sin useCallback, se crea nueva función en cada render
  const handleClick = useCallback(() => {
    console.log("Click!");
  }, []); // Función estable

  return (
    <>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <HijoMemoizado onClick={handleClick} />
    </>
  );
}

const HijoMemoizado = React.memo(function Hijo({ onClick }) {
  console.log("Hijo renderizado");
  return <button onClick={onClick}>Click me</button>;
});

Importante: No usar estos hooks prematuramente. Solo optimizar cuando hay problemas de rendimiento medibles. La memorización tiene su propio costo.`
  }
];

createPDF('react-hooks.pdf', 'React: Hooks y Manejo de Estado', reactContent);

// ============================================
// CURSO 3: MongoDB Fundamentals
// ============================================
const mongoContent = [
  {
    heading: '1. Conceptos Básicos de MongoDB',
    content: `MongoDB es una base de datos NoSQL orientada a documentos. A diferencia de las bases de datos relacionales, almacena datos en documentos flexibles similares a JSON.

Conceptos clave:
- Base de datos: contenedor de colecciones
- Colección: grupo de documentos (similar a una tabla)
- Documento: registro individual en formato BSON (similar a un objeto JSON)

Estructura de un documento:
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "nombre": "María García",
  "email": "maria@ejemplo.com",
  "edad": 28,
  "direccion": {
    "calle": "Gran Vía 123",
    "ciudad": "Madrid",
    "pais": "España"
  },
  "intereses": ["programación", "música", "viajes"],
  "createdAt": ISODate("2024-01-15T10:30:00Z")
}

El campo _id es obligatorio y único. Si no lo proporcionas, MongoDB genera automáticamente un ObjectId.

Ventajas de MongoDB:
- Esquema flexible: cada documento puede tener estructura diferente
- Escalabilidad horizontal mediante sharding
- Alto rendimiento en lecturas y escrituras
- Documentos anidados reducen necesidad de joins
- Índices potentes incluyendo texto completo y geoespaciales`
  },
  {
    heading: '2. Operaciones CRUD',
    content: `CRUD significa Create, Read, Update, Delete - las operaciones básicas de base de datos.

CREATE - Insertar documentos:
// Insertar uno
db.usuarios.insertOne({
  nombre: "Juan",
  email: "juan@ejemplo.com"
});

// Insertar varios
db.usuarios.insertMany([
  { nombre: "Ana", email: "ana@ejemplo.com" },
  { nombre: "Pedro", email: "pedro@ejemplo.com" }
]);

READ - Consultar documentos:
// Encontrar todos
db.usuarios.find();

// Encontrar con filtro
db.usuarios.find({ edad: { $gte: 18 } });

// Encontrar uno
db.usuarios.findOne({ email: "juan@ejemplo.com" });

// Proyección (seleccionar campos)
db.usuarios.find({}, { nombre: 1, email: 1, _id: 0 });

UPDATE - Actualizar documentos:
// Actualizar uno
db.usuarios.updateOne(
  { email: "juan@ejemplo.com" },
  { $set: { edad: 30 } }
);

// Actualizar varios
db.usuarios.updateMany(
  { activo: false },
  { $set: { activo: true } }
);

// Reemplazar documento completo
db.usuarios.replaceOne(
  { _id: ObjectId("...") },
  { nombre: "Juan Nuevo", email: "nuevo@ejemplo.com" }
);

DELETE - Eliminar documentos:
db.usuarios.deleteOne({ email: "juan@ejemplo.com" });
db.usuarios.deleteMany({ activo: false });`
  },
  {
    heading: '3. Operadores de Consulta',
    content: `MongoDB proporciona operadores potentes para consultas complejas.

Operadores de comparación:
$eq: igual a
$ne: no igual a
$gt: mayor que
$gte: mayor o igual que
$lt: menor que
$lte: menor o igual que
$in: valor está en array
$nin: valor no está en array

Ejemplos:
db.productos.find({ precio: { $gte: 100, $lte: 500 } });
db.usuarios.find({ rol: { $in: ["admin", "moderador"] } });

Operadores lógicos:
$and: todas las condiciones deben cumplirse
$or: al menos una condición debe cumplirse
$not: niega la condición
$nor: ninguna condición debe cumplirse

Ejemplos:
db.productos.find({
  $and: [
    { precio: { $lt: 100 } },
    { stock: { $gt: 0 } }
  ]
});

db.usuarios.find({
  $or: [
    { edad: { $lt: 18 } },
    { edad: { $gt: 65 } }
  ]
});

Operadores de elementos:
$exists: el campo existe
$type: el campo es de cierto tipo

db.usuarios.find({ telefono: { $exists: true } });

Operadores de arrays:
$all: array contiene todos los valores
$elemMatch: elemento cumple todas las condiciones
$size: array tiene tamaño específico

db.usuarios.find({ intereses: { $all: ["música", "deportes"] } });
db.pedidos.find({ items: { $elemMatch: { cantidad: { $gt: 5 } } } });`
  },
  {
    heading: '4. Aggregation Pipeline',
    content: `El Aggregation Pipeline es el framework de MongoDB para transformar y analizar datos. Procesa documentos a través de etapas (stages) secuenciales.

Etapas principales:
$match: filtra documentos (como find)
$group: agrupa y calcula agregados
$sort: ordena documentos
$project: selecciona/transforma campos
$limit/$skip: paginación
$lookup: join con otra colección
$unwind: descompone arrays

Ejemplo - Ventas por categoría:
db.ventas.aggregate([
  // Filtrar ventas del último mes
  { $match: {
    fecha: { $gte: ISODate("2024-01-01") }
  }},
  // Agrupar por categoría
  { $group: {
    _id: "$categoria",
    totalVentas: { $sum: "$monto" },
    cantidadVentas: { $count: {} },
    promedioVenta: { $avg: "$monto" }
  }},
  // Ordenar por total descendente
  { $sort: { totalVentas: -1 } },
  // Limitar a top 5
  { $limit: 5 }
]);

Ejemplo - Join con $lookup:
db.pedidos.aggregate([
  { $lookup: {
    from: "usuarios",
    localField: "usuarioId",
    foreignField: "_id",
    as: "usuario"
  }},
  { $unwind: "$usuario" },
  { $project: {
    numeroPedido: 1,
    total: 1,
    "usuario.nombre": 1,
    "usuario.email": 1
  }}
]);

$unwind convierte un documento con array en múltiples documentos, uno por cada elemento del array.`
  },
  {
    heading: '5. Índices',
    content: `Los índices mejoran drásticamente el rendimiento de las consultas al evitar escaneos completos de colección.

Crear índices:
// Índice simple ascendente
db.usuarios.createIndex({ email: 1 });

// Índice descendente
db.usuarios.createIndex({ createdAt: -1 });

// Índice compuesto
db.productos.createIndex({ categoria: 1, precio: -1 });

// Índice único
db.usuarios.createIndex({ email: 1 }, { unique: true });

// Índice de texto para búsquedas
db.articulos.createIndex({ titulo: "text", contenido: "text" });

Tipos de índices:
- Single field: un campo
- Compound: múltiples campos
- Multikey: para arrays
- Text: búsqueda de texto completo
- Geospatial: datos geográficos (2d, 2dsphere)
- Hashed: para sharding

Ver índices existentes:
db.usuarios.getIndexes();

Analizar uso de índices con explain():
db.usuarios.find({ email: "test@ejemplo.com" }).explain("executionStats");

Revisar el campo "stage":
- COLLSCAN: escaneo completo (malo)
- IXSCAN: uso de índice (bueno)
- FETCH: recuperar documentos

Buenas prácticas:
- Crear índices para campos frecuentemente consultados
- Índices compuestos siguen orden de izquierda a derecha
- Los índices ocupan memoria y ralentizan escrituras
- Usar explain() para verificar uso de índices`
  },
  {
    heading: '6. Mongoose con Node.js',
    content: `Mongoose es una librería ODM (Object Document Mapper) que facilita trabajar con MongoDB desde Node.js.

Conexión:
import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/miapp');

Definir esquema y modelo:
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  edad: { type: Number, min: 0, max: 150 },
  rol: {
    type: String,
    enum: ['usuario', 'admin'],
    default: 'usuario'
  },
  activo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

Operaciones CRUD con Mongoose:
// Crear
const usuario = await Usuario.create({ nombre: "Ana", email: "ana@ej.com" });

// Leer
const usuarios = await Usuario.find({ activo: true });
const usuario = await Usuario.findById(id);
const usuario = await Usuario.findOne({ email: "ana@ej.com" });

// Actualizar
await Usuario.findByIdAndUpdate(id, { nombre: "Ana María" });
await Usuario.updateMany({ rol: "usuario" }, { $set: { verificado: false } });

// Eliminar
await Usuario.findByIdAndDelete(id);
await Usuario.deleteMany({ activo: false });

Middleware (hooks):
usuarioSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

Métodos personalizados:
usuarioSchema.methods.compararPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};`
  }
];

createPDF('mongodb-fundamentals.pdf', 'MongoDB: Fundamentos y Mongoose', mongoContent);

// ============================================
// CURSO 4: Node.js y Express
// ============================================
const nodeContent = [
  {
    heading: '1. Introducción a Node.js',
    content: `Node.js es un entorno de ejecución de JavaScript construido sobre el motor V8 de Chrome. Permite ejecutar JavaScript fuera del navegador, principalmente para crear aplicaciones del lado del servidor.

Características principales:
- Event-driven y non-blocking I/O: maneja múltiples conexiones sin bloquear
- Single-threaded con event loop: eficiente en memoria
- NPM: el gestor de paquetes más grande del mundo
- Cross-platform: funciona en Windows, macOS y Linux

Crear un servidor HTTP básico:
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('¡Hola Mundo!');
});

server.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});

Node.js es ideal para:
- APIs REST y GraphQL
- Aplicaciones en tiempo real (chat, colaboración)
- Microservicios
- Herramientas CLI
- Streaming de datos`
  },
  {
    heading: '2. Módulos en Node.js',
    content: `Node.js tiene un sistema de módulos para organizar y reutilizar código.

CommonJS (sistema tradicional):
// math.js - exportar
module.exports = {
  sumar: (a, b) => a + b,
  restar: (a, b) => a - b
};

// app.js - importar
const math = require('./math');
console.log(math.sumar(2, 3)); // 5

ES Modules (moderno, requiere "type": "module" en package.json):
// math.js - exportar
export const sumar = (a, b) => a + b;
export const restar = (a, b) => a - b;

// app.js - importar
import { sumar, restar } from './math.js';

Módulos built-in importantes:
- fs: sistema de archivos
- path: manejo de rutas
- http/https: servidores y clientes HTTP
- crypto: criptografía
- os: información del sistema operativo
- events: emisores de eventos
- stream: manejo de streams
- util: utilidades

Ejemplo con fs (File System):
const fs = require('fs').promises;

async function leerArchivo() {
  try {
    const contenido = await fs.readFile('archivo.txt', 'utf-8');
    console.log(contenido);
  } catch (error) {
    console.error('Error leyendo archivo:', error);
  }
}`
  },
  {
    heading: '3. Express.js Fundamentos',
    content: `Express es el framework web más popular para Node.js. Simplifica la creación de servidores y APIs.

Instalación:
npm install express

Aplicación básica:
const express = require('express');
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Ruta GET
app.get('/', (req, res) => {
  res.json({ mensaje: 'Hola Mundo' });
});

// Ruta con parámetros
app.get('/usuarios/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id, nombre: 'Usuario ' + id });
});

// Ruta POST
app.post('/usuarios', (req, res) => {
  const { nombre, email } = req.body;
  res.status(201).json({ id: 1, nombre, email });
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('API en http://localhost:3000');
});

Métodos HTTP comunes:
- GET: obtener recursos
- POST: crear recursos
- PUT: actualizar recurso completo
- PATCH: actualizar parcialmente
- DELETE: eliminar recursos

Query parameters:
// GET /buscar?q=javascript&limit=10
app.get('/buscar', (req, res) => {
  const { q, limit } = req.query;
  res.json({ busqueda: q, limite: limit });
});`
  },
  {
    heading: '4. Middleware en Express',
    content: `Los middleware son funciones que tienen acceso al objeto request (req), response (res), y la función next(). Se ejecutan en orden.

Estructura de un middleware:
function miMiddleware(req, res, next) {
  // Hacer algo
  console.log('Petición recibida:', req.method, req.url);
  next(); // Pasar al siguiente middleware
}

Tipos de middleware:

1. Middleware de aplicación:
app.use((req, res, next) => {
  req.requestTime = Date.now();
  next();
});

2. Middleware de ruta:
app.get('/admin', verificarAdmin, (req, res) => {
  res.json({ admin: true });
});

3. Middleware de manejo de errores (4 parámetros):
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

Middleware comunes de terceros:
- cors: habilitar CORS
- helmet: headers de seguridad
- morgan: logging de peticiones
- compression: comprimir respuestas

Ejemplo con CORS y logging:
const cors = require('cors');
const morgan = require('morgan');

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

Middleware de autenticación:
function autenticar(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}`
  },
  {
    heading: '5. Estructura de Proyecto y Rutas',
    content: `Una buena estructura facilita el mantenimiento y escalabilidad.

Estructura recomendada:
proyecto/
  src/
    controllers/     # Lógica de negocio
    routes/          # Definición de rutas
    middleware/      # Middleware personalizado
    models/          # Modelos de datos
    services/        # Servicios externos, lógica reutilizable
    utils/           # Utilidades
    config/          # Configuración
  app.js             # Configuración de Express
  server.js          # Punto de entrada

Separar rutas con Router:
// routes/usuarios.js
const router = require('express').Router();
const usuariosController = require('../controllers/usuarios');

router.get('/', usuariosController.listar);
router.get('/:id', usuariosController.obtener);
router.post('/', usuariosController.crear);
router.put('/:id', usuariosController.actualizar);
router.delete('/:id', usuariosController.eliminar);

module.exports = router;

// app.js
const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoutes);

Controladores:
// controllers/usuarios.js
const Usuario = require('../models/usuario');

exports.listar = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const usuario = await Usuario.create(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
};`
  },
  {
    heading: '6. Manejo de Errores y Validación',
    content: `El manejo correcto de errores es crítico para APIs robustas.

Errores personalizados:
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Uso
throw new AppError('Usuario no encontrado', 404);

Middleware de errores centralizado:
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Error interno';

  console.error('Error:', err);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

Wrapper para async/await:
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Uso
app.get('/usuarios', asyncHandler(async (req, res) => {
  const usuarios = await Usuario.find();
  res.json(usuarios);
}));

Validación con express-validator:
const { body, validationResult } = require('express-validator');

app.post('/usuarios',
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Crear usuario...
  }
);`
  }
];

createPDF('nodejs-express.pdf', 'Node.js y Express: APIs REST', nodeContent);

// ============================================
// CURSO 5: TypeScript Profesional
// ============================================
const typescriptContent = [
  {
    heading: '1. Introducción a TypeScript',
    content: `TypeScript es un superconjunto de JavaScript que añade tipado estático opcional. El código TypeScript se compila a JavaScript.

Beneficios de TypeScript:
- Detección de errores en tiempo de compilación
- Mejor autocompletado e IntelliSense en IDEs
- Código más mantenible y documentado
- Refactoring más seguro
- Soporte para características modernas de JavaScript

Instalación:
npm install -D typescript
npx tsc --init  # Crear tsconfig.json

Tipos básicos:
let nombre: string = "María";
let edad: number = 28;
let activo: boolean = true;
let lista: number[] = [1, 2, 3];
let tupla: [string, number] = ["edad", 28];

Inferencia de tipos:
let mensaje = "Hola";  // TypeScript infiere string
mensaje = 123;  // Error: Type 'number' is not assignable to type 'string'

El tipo 'any' desactiva el checking (evitar su uso):
let dato: any = "texto";
dato = 123;  // Sin error, pero perdemos beneficios

El tipo 'unknown' es más seguro que any:
let valor: unknown = "texto";
if (typeof valor === "string") {
  console.log(valor.toUpperCase());  // OK, TypeScript sabe que es string
}`
  },
  {
    heading: '2. Interfaces y Types',
    content: `Las interfaces y types definen la forma de los objetos.

Interfaces:
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  edad?: number;  // Propiedad opcional
  readonly createdAt: Date;  // Solo lectura
}

const usuario: Usuario = {
  id: 1,
  nombre: "Ana",
  email: "ana@ejemplo.com",
  createdAt: new Date()
};

Type aliases:
type ID = string | number;
type Punto = { x: number; y: number };

type Estado = "pendiente" | "activo" | "completado";  // Union literal
let estado: Estado = "activo";

Diferencias principales:
- Las interfaces pueden extenderse y fusionarse
- Los types son más flexibles para unions y tipos complejos

Extensión de interfaces:
interface Persona {
  nombre: string;
}

interface Empleado extends Persona {
  puesto: string;
  salario: number;
}

Intersection types:
type EmpleadoCompleto = Persona & {
  puesto: string;
  departamento: string;
};

Interfaces para funciones:
interface Operacion {
  (a: number, b: number): number;
}

const sumar: Operacion = (a, b) => a + b;`
  },
  {
    heading: '3. Funciones Tipadas',
    content: `TypeScript permite tipar parámetros, valores de retorno y funciones completas.

Funciones básicas:
function saludar(nombre: string): string {
  return "Hola, " + nombre;
}

// Arrow function
const multiplicar = (a: number, b: number): number => a * b;

Parámetros opcionales y por defecto:
function crearUsuario(
  nombre: string,
  email: string,
  edad?: number,  // Opcional
  rol: string = "usuario"  // Por defecto
): Usuario {
  return { nombre, email, edad, rol };
}

Rest parameters:
function sumarTodos(...numeros: number[]): number {
  return numeros.reduce((acc, n) => acc + n, 0);
}

Sobrecarga de funciones:
function procesar(valor: string): string;
function procesar(valor: number): number;
function procesar(valor: string | number): string | number {
  if (typeof valor === "string") {
    return valor.toUpperCase();
  }
  return valor * 2;
}

Funciones como tipos:
type Callback = (error: Error | null, resultado?: string) => void;

function operacionAsincrona(callback: Callback): void {
  // ...
}

Funciones genéricas:
function primero<T>(array: T[]): T | undefined {
  return array[0];
}

const num = primero([1, 2, 3]);  // number | undefined
const str = primero(["a", "b"]);  // string | undefined`
  },
  {
    heading: '4. Genéricos',
    content: `Los genéricos permiten crear componentes reutilizables que trabajan con múltiples tipos.

Función genérica básica:
function identidad<T>(valor: T): T {
  return valor;
}

const numero = identidad<number>(42);
const texto = identidad("hola");  // Inferencia automática

Interfaces genéricas:
interface Respuesta<T> {
  data: T;
  status: number;
  mensaje: string;
}

interface Usuario { id: number; nombre: string; }

const respuesta: Respuesta<Usuario> = {
  data: { id: 1, nombre: "Ana" },
  status: 200,
  mensaje: "OK"
};

Restricciones con extends:
interface ConId {
  id: number;
}

function obtenerPorId<T extends ConId>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id);
}

Múltiples tipos genéricos:
function mapear<T, U>(array: T[], transformar: (item: T) => U): U[] {
  return array.map(transformar);
}

const numeros = [1, 2, 3];
const strings = mapear(numeros, n => n.toString());

Clases genéricas:
class Cola<T> {
  private items: T[] = [];

  agregar(item: T): void {
    this.items.push(item);
  }

  sacar(): T | undefined {
    return this.items.shift();
  }
}

const colaNumeros = new Cola<number>();
colaNumeros.agregar(1);
colaNumeros.agregar(2);`
  },
  {
    heading: '5. Utility Types',
    content: `TypeScript incluye tipos de utilidad para transformar tipos existentes.

Partial<T> - Hace todas las propiedades opcionales:
interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

function actualizarUsuario(id: number, cambios: Partial<Usuario>) {
  // cambios puede tener solo algunas propiedades
}

actualizarUsuario(1, { nombre: "Nuevo nombre" });

Required<T> - Hace todas las propiedades requeridas:
interface Config {
  debug?: boolean;
  timeout?: number;
}

const configCompleta: Required<Config> = {
  debug: true,
  timeout: 5000
};

Readonly<T> - Hace todas las propiedades de solo lectura:
const usuario: Readonly<Usuario> = { id: 1, nombre: "Ana", email: "ana@ej.com" };
usuario.nombre = "Otro";  // Error: Cannot assign to 'nombre'

Pick<T, K> - Selecciona propiedades específicas:
type UsuarioBasico = Pick<Usuario, "id" | "nombre">;
// { id: number; nombre: string }

Omit<T, K> - Excluye propiedades:
type SinEmail = Omit<Usuario, "email">;
// { id: number; nombre: string }

Record<K, T> - Crea tipo con claves K y valores T:
type Roles = "admin" | "usuario" | "invitado";
type Permisos = Record<Roles, string[]>;

const permisos: Permisos = {
  admin: ["leer", "escribir", "eliminar"],
  usuario: ["leer", "escribir"],
  invitado: ["leer"]
};

NonNullable<T> - Excluye null y undefined:
type MaybeString = string | null | undefined;
type DefinitelyString = NonNullable<MaybeString>;  // string`
  },
  {
    heading: '6. TypeScript con React',
    content: `TypeScript mejora significativamente el desarrollo con React.

Componentes funcionales:
interface Props {
  nombre: string;
  edad?: number;
  onClick: () => void;
}

const Saludo: React.FC<Props> = ({ nombre, edad, onClick }) => {
  return (
    <div onClick={onClick}>
      Hola, {nombre}
      {edad && <span> ({edad} años)</span>}
    </div>
  );
};

// Alternativa sin React.FC (más recomendado):
function Saludo({ nombre, edad, onClick }: Props) {
  return <div>...</div>;
}

useState con tipos:
const [usuario, setUsuario] = useState<Usuario | null>(null);
const [items, setItems] = useState<string[]>([]);

useRef con tipos:
const inputRef = useRef<HTMLInputElement>(null);
const valorRef = useRef<number>(0);

Eventos tipados:
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};

Props con children:
interface LayoutProps {
  children: React.ReactNode;
  titulo?: string;
}

function Layout({ children, titulo }: LayoutProps) {
  return (
    <div>
      {titulo && <h1>{titulo}</h1>}
      {children}
    </div>
  );
}

Custom hooks tipados:
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue] as const;
}`
  }
];

createPDF('typescript-profesional.pdf', 'TypeScript: Desarrollo Profesional', typescriptContent);

console.log('\n✨ Todos los PDFs han sido generados en data/courses/');
