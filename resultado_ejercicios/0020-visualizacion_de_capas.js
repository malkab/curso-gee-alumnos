// -----------------------
//
// Visualización de capas en RGB (color verdadero y falso).
//
// -----------------------

// Usemos variables que para eso están. Las variables nos ayudan a parametrizar nuestros scripts.
// Definimos las bandas que usaremos para visualizar en RGB.
var capa_rojo = "SR_B4";
var capa_verde = "SR_B5";
var capa_azul = "SR_B3";
var min_stretch = 0;
var max_stretch = 20000;


// -----------------------
// Si parametrizamos en la cabecera lo suficiente, a partir de
// este punto el código sería inmutable.

// Cargamos la colección.
var landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterDate('2018-01-01', '2019-01-01')
    .filterBounds(geometry)
    .select([capa_rojo, capa_verde, capa_azul])
    .filterMetadata("CLOUD_COVER", "less_than", 10);

// Reducimos la colección a una sola imagen usando la función
// reductora "mediana".
var imagen_mediana = landsat.median();

// Características de visualización.
var visualizacion = {
    // Las bandas que queremos ver, en los canales RGB.
    bands: [capa_rojo, capa_verde, capa_azul],
    // El valor mínimo y máximo que se asigna para el stretching
    // de visualización.
    min: min_stretch,
    max: max_stretch
}

// Visualización.
Map.addLayer(imagen_mediana, visualizacion, "RGB");
