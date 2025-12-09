// Importaciones. Tradicionalmente se ponen en la cabecera de los
// scripts para tener claras las dependencias del mismo y que
// estén cargadas en memoria antes de ejecutar código cliente.

// Ajustar a cada circunstancia.
var l8 = require('users/jpperezalcantara/repo:lib/landsat8');
var constantes = require('users/jpperezalcantara/repo:lib/constantes');

/*

    Máscaras sobre colecciones de imágenes.

*/

/*

    Imaginemos que queremos estudiar sólo el NDVI mayor que 0.
    Para hacerlo, necesitamos desarrollar una máscara sobre los
    datos.

    Primero, cargamos la colección y calculamos el NDVI, como en
    el módulo anterior.

*/
var capas = ["SR_B5", "SR_B4", "SR_B3", "SR_B2"]

// Nótese el uso de las funciones importadas desde el módulo
// landsat8:
var landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterDate('2018-01-01', '2019-01-01')
    .filterBounds(geometry)
    .select(capas)
    .filterMetadata("CLOUD_COVER", "less_than", 10)
    .map(l8.ndvi)
    .map(l8.reflectancia);

// Comprobamos que todo ha ido bien:
print(landsat);

/*

    Como solemos hacer, probemos primero con la primera imagen
    para ver la lógica de manipulación sobre una sóla imagen:

*/
var img_0 = landsat.first();
print(img_0);

// Visualizamos el NDVI sin máscara:
var visualizacion_ndvi = {
    min: -0.2,
    max: 0.4,
    palette: constantes.PALETA_BICROMATICA
}

Map.addLayer(img_0.select('NDVI'), visualizacion_ndvi, "NDVI");

/*

    Utilizamos la función updateMask() para aplicar la máscara
    sobre la imagen. La función updateMask() recibe como
    argumento una imagen binaria (1s y 0s) que indica qué píxeles
    se deben mantener (1) y cuáles enmascarar (0).

    En nuestro caso, queremos mantener los píxeles con NDVI > 0.
    Podemos crear esa imagen binaria con una simple operación
    lógica:

*/
var mascara_ndvi_mayor_que_cero = img_0.select('NDVI').gt(0);

print(mascara_ndvi_mayor_que_cero);

Map.addLayer(mascara_ndvi_mayor_que_cero,
    { min: 0, max: 1, palette: ['red', 'green'] },
    "Máscara NDVI > 0"
);

/*

    Aplicamos la máscara a la imagen, de forma directa:

*/
var img_0_mascarada = img_0.updateMask(img_0.select('NDVI').gt(0));

print(img_0_mascarada);

// Visualizamos el NDVI con máscara:
var visualizacion_ndvi_mascara = {
    min: 0,
    max: 1,
    palette: ["yellow", "red"]
}

Map.addLayer(img_0_mascarada.select('NDVI'),
    visualizacion_ndvi_mascara,
    "NDVI mascarada > 0"
);
