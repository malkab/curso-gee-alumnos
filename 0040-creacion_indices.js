/*

    Creación de índices.

    Vamos a calcular el NDVI de la colección con la técnica vista
    en el módulo anterior.

    Cogemos las capas para el cálculo NDVI y para hacer una
    visualización del visible.

*/
var capas = ["SR_B5", "SR_B4", "SR_B3", "SR_B2"]

// Cargamos la colección filtrada.
var landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterDate('2018-01-01', '2019-01-01')
    .filterBounds(geometry)
    .select(capas)
    .filterMetadata("CLOUD_COVER", "less_than", 10);

/*

    Ahora tenemos que crear una función para calcular el NDVI
    sobre toda la colección. Pero antes, algunas funciones
    útiles: select(): selecciona una banda de la colección:

*/
var nir = landsat.select('SR_B5');
print(nir);

/*

    Esto cogería la banda SR_B5 (NIR) de toda la colección
    landsat. El resultado es otra colección, pero con una sola
    banda.

    Sin embargo, para el ejemplo, cojamos las bandas NIR y roja
    sólo de la primera imagen:

*/
var nir = landsat.first().select('SR_B5');
print(nir);

var rojo = landsat.first().select('SR_B4');
print(rojo);

/*

    Estas estructuras de datos son idénticas en estructura.
    Gracias a ello, GEE puede hacer operaciones matriciales de
    alta eficiencia entre ellas:

*/
var resta = nir.subtract(rojo);
print(resta);

// El NDVI desarrollado sería:
var ndvi = nir.subtract(rojo).divide(nir.add(rojo));
print(ndvi);

/*

    O, más compacto, actuando directamente sobre la primera
    imagen:

*/
var img_0 = landsat.first();
var ndvi = img_0.normalizedDifference(['SR_B5', 'SR_B4']);
print(ndvi);

/*

    Ahora que comprendemos las funciones que permiten realizar
    álgebra de capas, debemos aprovechar la extraordinaria
    capacidad de programación funcional de GEE para aplicar la
    operación masivamente a toda una colección de imágenes
    gracias a la función map() propia de éstas. Necesitamos
    encapsular la lógica del índice en una función que sea
    compatible con map():

*/
function calcularNDVI(image) {
    var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4'])
                    .rename('NDVI');
    return image.addBands(ndvi);
}

// Ahora aplicamos la función a toda la colección:
var landsat_ndvi = landsat.map(calcularNDVI);
print(landsat_ndvi);

/*

    Ya tenemos el NDVI calculado para toda la colección. Vamos a
    visualizar algunos resultados.

    Aplicamos el cálculo de la reflectividad a las capas del
    visible. Lo hacemos ahora y no antes de calcular el NDVI
    porque el escalar offset -0.2 destruye matemáticamente el
    cálculo del índice. Al fin y al cabo, el índice es
    adimensional y le da igual ser calculado a partir de números
    enteros de 16 bits o con reflectividades reales con
    decimales. La diferencia: la primera opción es varios órdenes
    de magnitud más rápida:

*/
function escalaL8(image) {
    var bandas_opticas = image.select('SR_B.')
        .multiply(0.0000275)
        .add(-0.2);

    return image.addBands(bandas_opticas, null, true);
}

var landsat_ndvi = landsat_ndvi.map(escalaL8);
print(landsat_ndvi);

/*

    Nótese que la función applyScaleFactors() no afecta al NDVI
    puesto que la expresión regular 'SR_B.' no selecciona la banda
    'NDVI'.

    Vamos a visualizar y jugar un poco con los resultados.
    Primero, vamos a definir una escala de color para el NDVI,
    bicromática. Es útil la página ColorBrewer para elegir
    paletas para cartografía:

    Colores tirando a rojo: bajo NDVI
    Colores tirando al amarillo pálido: 0
    Colores tirando a azul: alto NDVI

*/
var paleta_bicromatica = [
    '#d7191c',
    '#fdae61',
    '#ffffbf',
    '#abdda4',
    '#2b83ba'
];

// Características de visualización.
var visualizacion_ndvi = {
    // El valor mínimo y máximo que se asigna para el stretching
    // de visualización.
    min: -0.2,
    max: 0.4,
    palette: paleta_bicromatica
}

// Visualización.
Map.addLayer(landsat_ndvi.select('NDVI'), visualizacion_ndvi, "NDVI");

// Añadimos una capa en falso color para comparar:
var visualizacion_rgb = {
    bands: ['SR_B5', 'SR_B3', 'SR_B2'],
    min: 0,
    max: 0.3
}
Map.addLayer(landsat_ndvi, visualizacion_rgb, "RGB");

/*

    Podemos componer los NDVI de toda la colección en una única
    capa:

*/
var ndvi_median = landsat_ndvi.select('NDVI').median();
Map.addLayer(ndvi_median, visualizacion_ndvi, "NDVI mediana");

// O el máximo y el mínimo de la serie:
var ndvi_max = landsat_ndvi.select('NDVI').max();
Map.addLayer(ndvi_max, visualizacion_ndvi, "NDVI máximo");

var ndvi_min = landsat_ndvi.select('NDVI').min();
Map.addLayer(ndvi_min, visualizacion_ndvi, "NDVI mínimo");

/*

    Trabajemos un poco los histogramas. Saquemos un histograma
    del NDVI de un polígono de piscifactorías y otro de
    arrozales. Para ello, creamos primero dos polígonos, uno con
    el nombre "Piscifactorias" y otro "Arrozal".

    Una vez creados, le podremos decir a GEE que nos construya el
    histograma del NDVI en esas zonas y las visualice.

*/
var histograma_piscifactorias = ui.Chart.image.histogram({
  image: ndvi_median,
  region: Piscifactorias,
  scale: 30,
  maxBuckets: 256
}).setOptions({
  title: 'NDVI en piscifactorías',
  hAxis: {title: 'NDVI'},
  vAxis: {title: '# píxeles'}
});

var histograma_arrozal = ui.Chart.image.histogram({
  image: ndvi_median,
  region: Arrozal,
  scale: 30,
  maxBuckets: 256
}).setOptions({
  title: 'NDVI en arrozales',
  hAxis: {title: 'NDVI'},
  vAxis: {title: '# píxeles'}
});

print(histograma_piscifactorias);
print(histograma_arrozal);


/*

    Ejercicios:

    1. Crear y visualizar una nueva capa en toda la colección en
       la que todos los píxeles estén establecidos a 1.

       (Pista: utilizar select() sobre cualquier capa para crear
       una capa "nueva", en blanco, resetearla a 0 con una
       multiplicación y añadirle 1).

    2. Crear un índice NBR (Normalized Burn Ratio) para toda la
       colección. El NBR se calcula como (NIR - SWIR2) /
       (NIR + SWIR2), es decir, (SR_B5 - SR_B7) /
       (SR_B5 + SR_B7).

       Visualizar el NBR con una paleta que vaya de verde (bajo
       NBR) a rojo (alto NBR).

*/