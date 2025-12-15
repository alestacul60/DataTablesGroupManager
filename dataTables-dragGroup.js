// dataTables-groupManager.js - Versión corregida para manejar null
(function($) {
    'use strict';

    // Plugin principal
    $.fn.dataTableGroupManager = function(options) {
        const config = $.extend({
            maxGroups: 3,
            saveState: true,
            debug: false,
            onGroupChange: null
        }, options);
        
        return this.each(function() {
            const $table = $(this);
            const tableId = $table.attr('id');
            
            if (!tableId) {
                console.warn('La tabla debe tener un ID');
                return;
            }
            
            const table = $table.DataTable();
            if (!table) {
                console.warn('No se encontró instancia de DataTables:', tableId);
                return;
            }
            
            // Estado
            let groups = []; // Guardamos índices de columnas
            const stateKey = `dt-groups-${tableId}`;
            
            // Inicializar
            init();
            
            function init() {
                log('Inicializando GroupManager para tabla:', tableId);
                
                // Cargar estado guardado
                loadState();
                
                // Agregar estilos
                addStyles();
                
                // Crear interfaz de usuario
                createUI();
                
                // Aplicar grupos iniciales
                applyGroups();
                
                // Actualizar UI
                updateUI();
                
                // Configurar eventos
                setupEvents();
            }
            
            function log(...args) {
                if (config.debug) {
                    console.log('[GroupManager]', ...args);
                }
            }
            
            function addStyles() {
                if ($('#dt-group-manager-styles').length) return;
                
                const styles = `
                    .dt-group-manager-container {
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                    
                    .dt-group-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #dee2e6;
                    }
                    
                    .dt-group-title {
                        font-size: 16px;
                        font-weight: 600;
                        color: #495057;
                    }
                    
                    .dt-group-controls {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .dt-group-count {
                        background: #6c757d;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: bold;
                    }
                    
                    .dt-group-clear-btn {
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        font-size: 13px;
                        cursor: pointer;
                    }
                    
                    .dt-group-clear-btn:disabled {
                        background: #adb5bd;
                        cursor: not-allowed;
                    }
                    
                    .dt-group-columns-container {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        margin-bottom: 10px;
                        max-height: 200px;
                        overflow-y: auto;
                        padding: 5px;
                    }
                    
                    .dt-group-column-btn {
                        background: white;
                        border: 1px solid #dee2e6;
                        border-radius: 4px;
                        padding: 6px 12px;
                        font-size: 13px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    }
                    
                    .dt-group-column-btn:hover {
                        border-color: #adb5bd;
                    }
                    
                    .dt-group-column-btn.active {
                        background: #d1e7dd;
                        border-color: #badbcc;
                        color: #0f5132;
                        font-weight: 500;
                    }
                    
                    .dt-group-column-btn .btn-icon {
                        font-size: 14px;
                    }
                    
                    .dt-group-column-btn.active .btn-icon {
                        color: #198754;
                    }
                    
                    .dt-group-status {
                        font-size: 13px;
                        color: #6c757d;
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid #dee2e6;
                    }
                    
                    .dt-group-order {
                        font-size: 11px;
                        color: #6c757d;
                        margin-left: 5px;
                    }
                `;
                
                $('<style id="dt-group-manager-styles">' + styles + '</style>').appendTo('head');
            }
            
            function createUI() {
                // Buscar contenedor
                const $container = $table.closest('.dataTables_wrapper, .table-responsive, .card-body');
                if (!$container.length) {
                    $container = $table.parent();
                }
                
                if (!$container.length) {
                    console.error('No se encontró contenedor para la UI');
                    return;
                }
                
                // Crear UI
                const uiHtml = `
                    <div class="dt-group-manager-container" id="dt-group-manager-${tableId}">
                        <div class="dt-group-header">
                            <div class="dt-group-title">Agrupar por Columnas</div>
                            <div class="dt-group-controls">
                                <span class="dt-group-count">0/${config.maxGroups}</span>
                                <button class="dt-group-clear-btn" disabled>Limpiar</button>
                            </div>
                        </div>
                        <div class="dt-group-columns-container" id="dt-group-columns-${tableId}">
                            <!-- Columnas se cargarán aquí -->
                        </div>
                        <div class="dt-group-status" id="dt-group-status-${tableId}">
                            No hay columnas agrupadas
                        </div>
                    </div>
                `;
                
                $container.prepend(uiHtml);
                
                // Evento para limpiar
                $(`#dt-group-manager-${tableId} .dt-group-clear-btn`).on('click', function() {
                    if (groups.length > 0 && confirm('¿Eliminar todas las agrupaciones?')) {
                        clearAllGroups();
                    }
                });
                
                // Cargar columnas
                loadColumns();
            }
            
            function loadColumns() {
                const $container = $(`#dt-group-columns-${tableId}`);
                if (!$container.length) return;
                
                $container.empty();
                
                // Obtener todas las columnas
                const columns = [];
                
                table.columns().every(function(index) {
                    const column = this;
                    const $header = $(column.header());
                    const columnName = $header.text().trim() || `Col ${index + 1}`;
                    const dataSrc = column.dataSrc();
                    
                    // Solo agregar columnas con dataSrc válido
                    if (dataSrc && typeof dataSrc === 'string') {
                        columns.push({
                            index: index,
                            name: columnName,
                            dataSrc: dataSrc,
                            isGrouped: groups.includes(index)
                        });
                    } else {
                        log(`Columna ${index} (${columnName}) ignorada - dataSrc:`, dataSrc);
                    }
                });
                
                // Crear botones para cada columna válida
                columns.forEach(col => {
                    const groupIndex = groups.indexOf(col.index);
                    const isActive = groupIndex !== -1;
                    
                    const btnHtml = `
                        <button class="dt-group-column-btn ${isActive ? 'active' : ''}" 
                                data-column-index="${col.index}"
                                data-column-name="${col.name}"
                                data-column-datasrc="${col.dataSrc}">
                            <span class="btn-icon">${isActive ? '−' : '+'}</span>
                            ${col.name}
                            ${isActive ? `<span class="dt-group-order">#${groupIndex + 1}</span>` : ''}
                        </button>
                    `;
                    
                    $container.append(btnHtml);
                });
                
                // Configurar eventos de los botones
                $container.find('.dt-group-column-btn').on('click', function(e) {
                    e.stopPropagation();
                    const colIndex = parseInt($(this).data('column-index'));
                    const dataSrc = $(this).data('column-datasrc');
                    
                    log('Click en columna:', colIndex, 'dataSrc:', dataSrc);
                    
                    if (!dataSrc) {
                        alert('Esta columna no se puede agrupar');
                        return;
                    }
                    
                    if ($(this).hasClass('active')) {
                        removeGroup(colIndex);
                    } else {
                        addGroup(colIndex);
                    }
                });
            }
            
            function setupEvents() {
                // Actualizar cuando DataTables se redibuja
                table.on('draw.dtGroupManager', function() {
                    setTimeout(loadColumns, 50);
                });
            }
            
            function addGroup(colIndex) {
                log('Intentando agregar grupo para columna:', colIndex);
                
                // Verificar si la columna existe y tiene dataSrc válido
                if (colIndex < 0 || colIndex >= table.columns().count()) {
                    log('Índice de columna inválido:', colIndex);
                    return false;
                }
                
                const column = table.column(colIndex);
                const dataSrc = column.dataSrc();
                
                if (!dataSrc) {
                    log('Columna no tiene dataSrc válido:', colIndex);
                    alert('Esta columna no se puede agrupar');
                    return false;
                }
                
                if (groups.length >= config.maxGroups) {
                    alert(`Máximo ${config.maxGroups} grupos permitidos. Elimina un grupo primero.`);
                    return false;
                }
                
                if (!groups.includes(colIndex)) {
                    groups.push(colIndex);
                    log('Grupos actualizados:', groups);
                    
                    applyGroups();
                    saveState();
                    updateUI();
                    
                    return true;
                }
                
                return false;
            }
            
            function removeGroup(colIndex) {
                log('Intentando eliminar grupo para columna:', colIndex);
                
                const index = groups.indexOf(colIndex);
                if (index > -1) {
                    groups.splice(index, 1);
                    log('Grupos actualizados:', groups);
                    
                    applyGroups();
                    saveState();
                    updateUI();
                    
                    return true;
                }
                
                return false;
            }
            
            function clearAllGroups() {
                log('Limpiando todos los grupos');
                groups = [];
                applyGroups();
                saveState();
                updateUI();
            }
            
            function applyGroups() {
                log('Aplicando grupos. Índices:', groups);
                
                // Filtrar solo columnas con dataSrc válido
                const validGroups = groups.filter(colIndex => {
                    const column = table.column(colIndex);
                    const dataSrc = column.dataSrc();
                    const isValid = dataSrc && typeof dataSrc === 'string';
                    
                    if (!isValid) {
                        log(`Eliminando columna ${colIndex} - dataSrc inválido:`, dataSrc);
                    }
                    
                    return isValid;
                });
                
                // Si hay diferencias, actualizar groups
                if (validGroups.length !== groups.length) {
                    groups = validGroups;
                    saveState();
                }
                
                log('Grupos válidos después de filtrar:', groups);
                
                if (typeof table.rowGroup === 'function') {
                    if (groups.length > 0) {
                        // Obtener dataSrc de las columnas válidas
                        const dataSrcArray = groups.map(colIndex => {
                            const column = table.column(colIndex);
                            return column.dataSrc();
                        });
                        
                        log('Configurando rowGroup con dataSrc:', dataSrcArray);
                        
                        try {
                            table.rowGroup().enable().dataSrc(dataSrcArray);
                            log('rowGroup configurado exitosamente');
                        } catch (error) {
                            console.error('Error configurando rowGroup:', error);
                        }
                    } else {
                        table.rowGroup().disable();
                        log('rowGroup deshabilitado');
                    }
                    
                    // Redibujar la tabla
                    setTimeout(() => {
                        table.draw(false);
                    }, 100);
                } else {
                    console.warn('rowGroup no está disponible en esta tabla');
                }
                
                // Llamar callback
                if (typeof config.onGroupChange === 'function') {
                    config.onGroupChange([...groups]);
                }
            }
            
            function updateUI() {
                const $container = $(`#dt-group-manager-${tableId}`);
                if (!$container.length) return;
                
                // Actualizar contador
                $container.find('.dt-group-count').text(`${groups.length}/${config.maxGroups}`);
                
                // Actualizar botón de limpiar
                $container.find('.dt-group-clear-btn').prop('disabled', groups.length === 0);
                
                // Actualizar estado
                const $status = $container.find('.dt-group-status');
                if (groups.length === 0) {
                    $status.text('No hay columnas agrupadas');
                } else {
                    const columnNames = groups.map((colIndex, idx) => {
                        const column = table.column(colIndex);
                        const $header = $(column.header());
                        const name = $header.text().trim() || `Columna ${colIndex + 1}`;
                        return `${idx + 1}. ${name}`;
                    });
                    $status.html(`<strong>Agrupado por:</strong> ${columnNames.join(' → ')}`);
                }
                
                // Actualizar botones
                $container.find('.dt-group-column-btn').each(function() {
                    const $btn = $(this);
                    const colIndex = parseInt($btn.data('column-index'));
                    const isActive = groups.includes(colIndex);
                    const groupIndex = groups.indexOf(colIndex);
                    
                    $btn.toggleClass('active', isActive);
                    $btn.find('.btn-icon').text(isActive ? '−' : '+');
                    
                    // Actualizar número de orden
                    $btn.find('.dt-group-order').remove();
                    if (isActive) {
                        $btn.append(`<span class="dt-group-order">#${groupIndex + 1}</span>`);
                    }
                });
            }
            
            function loadState() {
                if (!config.saveState) return;
                
                try {
                    const saved = localStorage.getItem(stateKey);
                    if (saved) {
                        const savedGroups = JSON.parse(saved);
                        const columnCount = table.columns().count();
                        
                        // Filtrar solo índices válidos y con dataSrc
                        groups = savedGroups.filter(colIndex => {
                            if (colIndex < 0 || colIndex >= columnCount) {
                                return false;
                            }
                            
                            const column = table.column(colIndex);
                            const dataSrc = column.dataSrc();
                            return dataSrc && typeof dataSrc === 'string';
                        });
                        
                        // Limitar al máximo permitido
                        if (groups.length > config.maxGroups) {
                            groups = groups.slice(0, config.maxGroups);
                        }
                        
                        log('Grupos cargados del estado:', groups);
                    }
                } catch (e) {
                    console.warn('Error cargando grupos:', e);
                    groups = [];
                }
            }
            
            function saveState() {
                if (!config.saveState) return;
                
                try {
                    localStorage.setItem(stateKey, JSON.stringify(groups));
                    log('Grupos guardados:', groups);
                } catch (e) {
                    console.warn('Error guardando grupos:', e);
                }
            }
            
            // Exponer API pública
            $table.data('groupManager', {
                getGroups: () => [...groups],
                addGroup: (colIndex) => addGroup(colIndex),
                removeGroup: (colIndex) => removeGroup(colIndex),
                clearGroups: () => clearAllGroups(),
                refresh: () => {
                    loadColumns();
                    updateUI();
                }
            });
            
            log('GroupManager inicializado exitosamente');
        });
    };
    
    // Auto-inicialización mejorada
    $(document).ready(function() {
        // Función para inicializar una tabla
        function initTable($table) {
            const tableId = $table.attr('id');
            
            if (!tableId || $table.data('groupManagerInitialized')) {
                return;
            }
            
            // Marcar como inicializada
            $table.data('groupManagerInitialized', true);
            
            // Esperar a que DataTables esté completamente listo
            const checkInterval = setInterval(() => {
                if ($.fn.DataTable && $.fn.DataTable.isDataTable($table)) {
                    clearInterval(checkInterval);
                    
                    // Esperar un poco más para rowGroup
                    setTimeout(() => {
                        try {
                            $table.dataTableGroupManager({
                                maxGroups: 3,
                                saveState: true,
                                debug: true // Cambiar a false en producción
                            });
                        } catch (error) {
                            console.error('Error inicializando GroupManager:', error);
                        }
                    }, 500);
                }
            }, 100);
            
            // Timeout de seguridad
            setTimeout(() => clearInterval(checkInterval), 5000);
        }
        
        // Inicializar tablas existentes
        $('table.dataTable').each(function() {
            initTable($(this));
        });
        
        // Observar nuevas tablas
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    $(mutation.addedNodes).find('table.dataTable').each(function() {
                        initTable($(this));
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });

})(jQuery);