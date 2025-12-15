# 📊 DataTables Group Manager

Plugin jQuery para **DataTables** que permite **agrupar dinámicamente columnas (RowGroup)** mediante una interfaz visual, con soporte para múltiples niveles de agrupación, persistencia en `localStorage` y manejo seguro de columnas inválidas (`null`, funciones, etc).

## 🎯 ¿Qué problema soluciona este plugin?

DataTables incluye la extensión **RowGroup**, pero **no provee una forma nativa** de:

- ❌ Elegir columnas para agrupar desde la interfaz
- ❌ Cambiar dinámicamente los niveles de agrupación
- ❌ Limitar la cantidad de grupos activos
- ❌ Mostrar el orden de agrupación al usuario
- ❌ Persistir las agrupaciones entre recargas
- ❌ Validar columnas no agrupables (`data: null`, funciones, etc.)

Esto obliga a definir las agrupaciones **hardcodeadas** en JavaScript y reinicializar la tabla ante cualquier cambio.

---

### ✅ ¿Qué aporta DataTables Group Manager?

Este plugin extiende RowGroup agregando:

- ✔ Selector visual de columnas agrupables
- ✔ Activación y desactivación dinámica de grupos
- ✔ Soporte para múltiples niveles de agrupación
- ✔ Manejo seguro de columnas inválidas
- ✔ Integración sin modificar DataTables

---


## ✨ Características

- ✅ Agrupación dinámica por columnas
- 🔢 Soporte para múltiples niveles de agrupación
- 🧠 Manejo seguro de `dataSrc` nulos o inválidos
- 🧩 Interfaz visual integrada a DataTables
- 🔄 Auto–inicialización en tablas dinámicas

---

## 📦 Requisitos

- **jQuery** `>= 3.x`
- **DataTables** `>= 1.11`
- **DataTables RowGroup Extension**

---

## 📥 Instalación

### 1️⃣ Incluir dependencias

```html
<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- DataTables -->
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>

<!-- RowGroup -->
<script src="https://cdn.datatables.net/rowgroup/1.4.1/js/dataTables.rowGroup.min.js"></script>

<!-- Plugin -->
<script src="dataTables-groupManager.js"></script>

## 🚀 Uso básico

### HTML

```html
<table id="tablaEjemplo" class="dataTable">
    <thead>
        <tr>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Fecha</th>
        </tr>
    </thead>
</table>

```

```javascript
$('#tablaEjemplo').DataTable({
    rowGroup: {
        enable: true
    },
    columns: [
        { data: 'cliente' },
        { data: 'estado' },
        { data: 'fecha' }
    ]
});

//El plugin se inicializa automáticamente al detectar la tabla.

$table.dataTableGroupManager({
    maxGroups: 3,
    saveState: true,
    debug: false,
    onGroupChange: function(groups) {
        console.log('Grupos activos:', groups);
    }
});
```
### Opciones

| Opción | Tipo | Default | Descripción |
|------|------|--------|------------|
| `maxGroups` | Number | `3` | Máximo de columnas agrupadas |
| `saveState` | Boolean | `true` | Guarda estado en `localStorage` |
| `debug` | Boolean | `false` | Logs detallados en consola |
| `onGroupChange` | Function | `null` | Callback al cambiar grupos |

---

## 🧠 ¿En qué tablas funciona?

El plugin **solo funciona correctamente** si la tabla cumple:

- ✔ Tiene atributo `id`
- ✔ Está inicializada con DataTables
- ✔ Usa RowGroup
- ✔ Las columnas tienen `data` como **string**
- ✔ Tiene `<thead>`
- ✔ Clase `dataTable`

---

## ❌ Tablas NO compatibles

El plugin **NO funcionará** en:

- Columnas con `data: null`
- Columnas con `data` como función
- Tablas sin RowGroup
- Tablas sin `<thead>`
- Tablas sin `id`
- Server-side sin orden correcto

Las columnas inválidas son **ignoradas automáticamente**.
