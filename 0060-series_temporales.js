// Importamos librerías propias, ajustar a cada circunstancia.
var l8 = require('users/jpperezalcantara/curso-gee:lib/landsat8');
var constantes = require('users/jpperezalcantara/curso-gee:lib/constantes');

/*

    Manejo de series temporales.

    Vamos a examinar la serie temporal de cambios en NDVI.

    Parametrización del script:

*/

// Colección
var COLECCION = 'LANDSAT/LC08/C02/T1_L2';

// Filtro espacial
var AMBITO = geometry;

// Rango temporal
var FECHA_COMIENZO = '2023-01-01';
var FECHA_FIN = '2025-01-01';

// Cobertura nubosa máxima
var CLOUD_COVER_MAX = 80;


// -----------------------------
// A partir de aquí el script

// Abrimos la colección
var landsat = ee.ImageCollection(COLECCION)
    .filterBounds(AMBITO)
    .filterDate(FECHA_COMIENZO, FECHA_FIN)
    .filter(ee.Filter.lt('CLOUD_COVER', CLOUD_COVER_MAX));

/*

    Vamos a imponer un serio control de calidad sobre los píxeles
    de las imágenes. En Landsat, cada imagen trae una banda
    especial llamada QA_PIXEL en la que se recogen, como "flags
    binarios", las condiciones de calidad de cada píxel.

    Un "flag binario" es una técnica que consiste en usar los
    bits de un número para señalar condiciones de verdadero o
    falso. Por ejemplo, un número de 8 bits (un byte):

    Binario: 0 0 0 0 0 0 0 0 Decimal: 0

    Binario: 1 1 1 1 1 1 1 1 Decimal: 255

    puede utilizarse, en lugar de para codificar un número entre
    0 y 255, para utilizar cada uno de los bits posicionales para
    reflejar una condición de verdadero o falso. En el caso del
    QA_PIXEL de Landsat:

    bit 0: Fill                 : no hay datos, es un pixel de relleno
    bit 1: Dilated Cloud        : píxel en el buffer de nubes
    bit 2: Cirrus               : píxel con cirros
    bit 3: Cloud                : píxel con nubes
    bit 4: Cloud Shadow         : píxel en sombra de nube
    bit 5: Snow                 : píxel con nieve
    bit 6: Clear                : píxel claro, sin obstrucciones de nubes
    bit 7: Water                : píxel con agua

*/

/*

    Se pueden utilizar operaciones lógicas bitwise que comparan
    bit a bit las posiciones de los mismos, de forma que se puede
    "descifrar" para cada píxel si un determinado flag de calidad
    está activado.

*/

function mascara_qa_pixel(imagen) {
    // Seleccionamos la banda QA_PIXEL
    var qa = imagen.select('QA_PIXEL');

    // Creamos máscaras binarias para los flags de calidad que
    // nos interesa detectar.
    var dilatedCloud = 1 << 1;
    var cirrus       = 1 << 2;
    var cloud        = 1 << 3;
    var cloudShadow  = 1 << 4;
    var snow         = 1 << 5;
    var fill         = 1 << 0;

    // Vemos qué píxeles no tienen activados ninguno de los flags
    // anteriores.
    var mask = qa.bitwiseAnd(fill).eq(0)
        .and(qa.bitwiseAnd(dilatedCloud).eq(0))
        .and(qa.bitwiseAnd(cirrus).eq(0))
        .and(qa.bitwiseAnd(cloud).eq(0))
        .and(qa.bitwiseAnd(cloudShadow).eq(0))
        .and(qa.bitwiseAnd(snow).eq(0));

    // Enmascaramos la imagen con los píxeles que han pasado el
    // control de calidad.
    return imagen.updateMask(mask);
}

// Aplicamos la función de máscara a toda la colección.
var landsat = landsat.map(mascara_qa_pixel);

// Visualizamos la primera de las imágenes para ver el efecto de
// la máscara.
var visualizacion_color = {
    min: 3768.350741899525,
    max: 20234.064763854563,
    bands: ['SR_B5', 'SR_B4', 'SR_B3'],
}

Map.addLayer(landsat.first(), visualizacion_color, "Ejemplo máscara QA_PIXEL");

/*

    Calculamos el NDVI para las imágenes desde nuestra librería.

*/
var landsat = landsat.map(l8.ndvi);

/*

    Ahora vamos a calcular las medianas mensuales de NDVI.

    Primero, creamos dos objetos Date de ee para controlar las
    fechas de comienzo y fin.

*/
var fechaComienzo = ee.Date(FECHA_COMIENZO);
var fechaFin = ee.Date(FECHA_FIN);

// Calculamos los meses que hay entre ambas fechas.
var nMeses = fechaFin.difference(fechaComienzo, 'month').round();

/*

    Ahora vamos a crear una función que nos segmente la colección
    en un mes determinado y calcule la mediana del NDVI para
    dicho mes.

    El único parámetro de la función será el número del mes
    dentro del intervalo de la serie temporal. Es decir, si es un
    año, habrá 12 meses, del 0 al 11.

*/
function crearMedianaNdviMensual(n) {

    // Inicio y fin del mes n de la secuencia de meses.
    var inicio = fechaComienzo.advance(n, 'month');
    var fin = inicio.advance(1, 'month');

    // Filtramos la colección para quedarnos sólo con las del
    // mes.
    var subLandsat = landsat.filterDate(inicio, fin);

    // Le calculamos la mediana a la subserie e insertamos
    // algunos metadatos de control.
    var mediana = subLandsat.median()
        .set('system:time_start', inicio.millis())
        .set('fecha_comiento', inicio)
        .set('fecha_fin', fin);

    // Devolvemos resultado final.
    return mediana;

}

// Testeamos para el mes 1 de la secuencia.
var mediana_mes_1 = crearMedianaNdviMensual(1);

// Visualización para NDVI.
var visualizacion_ndvi = {
    min: -0.2,
    max: 0.6,
    bands: ['NDVI'],
    palette: constantes.PALETA_BICROMATICA
}

// Añadimos al mapa para comprobar.
Map.addLayer(mediana_mes_1, visualizacion_ndvi, "Mediana del mes 1 (test)");

/*

    Ahora toca automatizar este proceso para todos los meses de
    la serie temporal total.

*/
// Creamos una lista de ee de meses en la serie completa.
var listaMeses = ee.List.sequence(0, nMeses.subtract(1));

/*

    Aplicamos la función map() de las listas (similar en
    funcionalidad a la map() de las colecciones) para que la
    función crearMedianaNdviMensual() se aplique a cada uno de
    los meses de la lista.

*/
var listaMedianasMensuales = listaMeses.map(crearMedianaNdviMensual);

print(listaMedianasMensuales)

/*

    Y como lo que tenemos es una lista de imágenes, la podemos
    convertir en una nueva colección de imágenes.

*/
var medianasMensuales = ee.ImageCollection(listaMedianasMensuales);

print(medianasMensuales);

// La visualizamos en plan mosaico.
Map.addLayer(medianasMensuales, visualizacion_ndvi, "Medianas mensuales NDVI");

/*

    Visualización de la serie temporal sobre una geometría.

    Ahora ya podemos explotar el resultado analítico a gusto.

    Vamos a visualizar la serie temporal junto a las dos bandas
    que generan el índice.

*/

/*

    Para que estén a escala, sometemos a la colección de medianas
    a reescalado radiométrico.

*/
medianasMensuales = medianasMensuales.map(l8.reflectancia);

// Componemos un gráfico de la serie temporal.
var chart = ui.Chart.image.series({
    /*
        Aquí seleccionamos sólo las bandas que queremos en el
        gráfico. Si no, las muestra todas y es un galimatías.

        Recordad que siempre, en cualquier momento, podemos
        actuar de forma temporal sobre una colección filtrándola
        para un propósito específico, sin alterar la original a
        no ser que la reasignemos con var x = colección_filtrada.

    */
    imageCollection: medianasMensuales.select(['NDVI', 'SR_B5', 'SR_B4']),

    /*
        La geometría sobre la que actuar. Puede ser de cualquier
        tipo.
    */
    region: geometry,

    /*

        Función reductora para aplicar a la región extractiva.
        Obviamente los puntos se quedan igual. En este caso,
        usamos la media.

    */
    reducer: ee.Reducer.mean(),

    /*

        Escala del reductor. Por defecto dejamos la propia escala
        del Landsat, pero se pueden usar mayores para zonas muy
        amplias.

    */
    scale: 30
}).setOptions({
    // Algunos aspectos formales del gráfico.
    title: 'Serie temporal NDVI (Landsat 8)',
    hAxis: { title: 'Fecha' },
    vAxis: { title: 'NDVI' },
    lineWidth: 2,
    pointSize: 3
});

print(chart)

/*

    Trabajemos finalmente la exportación de resultados a GeoTIFF.

    Exportamos la mediana zonal de NDVI para todo el periodo,
    limitada a una zona poligonal.

    Dado que es una operación que Google Cloud hace en diferido,
    necesita un lugar que controle para hacer la exportación. Lo
    más sencillo para nuestro perfil de usuario es utilizar
    Google Drive.

*/
Export.image.toDrive({
    image: medianasMensuales
                .select(["SR_B.", "NDVI"])
                .median()
                // Clip a la geometría de exportación.
                .clip(geometry),
    // Nombre del ficlero.
    description: 'ndvi_mediana_zonal',
    // Directorio en Google Drive.
    folder: 'Google Earth Engine',
    // Escala de exportación, la resolución de Landsat 8.
    scale: 30,
    // Zona de exportación.
    region: geometry,
    // Píxeles máximos a exportar.
    maxPixels: 6000000000,
    // Sistema de proyección al que reproyectar en EPSG. En este
    // caso, ETRS89 / UTM zone 30N.
    crs: "EPSG:25830"
});

/*

    Vamos a crear una función para exportar cada una de las
    imágenes de la colección de medianas mensuales.

*/
function exportarMedianaMensual(imagen) {

    var fecha_literal = ee.Date(imagen.get("system:time_start"))
                    .format('YYYY_MM')
                    .getInfo();

    var nombre_imagen = 'ndvi_mediana_zonal_mensual_'+fecha_literal;

    Export.image.toDrive({
        image: imagen
                    .select(["SR_B.", "NDVI"])
                    .clip(geometry),
        // Nombre del ficlero.
        description: nombre_imagen,
        // Directorio en Google Drive.
        folder: 'Google Earth Engine/medianas_mensuales',
        // Escala de exportación, la resolución de Landsat 8.
        scale: 30,
        // Zona de exportación.
        region: geometry,
        // Píxeles máximos a exportar.
        maxPixels: 6000000000,
        // Sistema de proyección al que reproyectar en EPSG. En este
        // caso, ETRS89 / UTM zone 30N.
        crs: "EPSG:25830"
    })
}

// La probamos exportando la primera imagen de la colección.
exportarMedianaMensual(medianasMensuales.first());

/*

    Vamos a lanzarla sobre la colección. No podemos usar map()
    puesto que map() es una función que se ejecuta en el servidor
    pero las operaciones de exportación son 100% locales, con lo
    que el servidor no tiene contexto para ejecutarlas.

    Para ello, tenemos que dar un rodeo convirtiendo la colección
    primero en una lista "local" con las características de las
    imágenes de la colección.

*/
var listaMedianasMensuales = medianasMensuales
        .toList(medianasMensuales.size());

/*

    Le solicitamos al servidor el tamaño de la lista para hacer
    operaciones puramente locales.

*/
var nImagenes = listaMedianasMensuales.size().getInfo();

/*

    Y ahora, MUY EXCEPCIONALMENTE, podemos usar un bucle for
    corriente y moliente de JavaScript para hacer a volumen una
    operación 100% local. Esto debe ser EXCEPCIONAL, ya que el
    rendimiento es muy bajo.

    Mantenemos este bloque comentado por defecto porque es
    leeeeento y ralentiza muchísimo el script.

*/
// for (var i=0 ; i<nImagenes ; i++) {

//     // Cogemos la imagen i-ésima de la lista.
//     var imagen = ee.Image(listaMedianasMensuales.get(i));

//     // Llamamos a la función de exportación.
//     exportarMedianaMensual(imagen);

// }
