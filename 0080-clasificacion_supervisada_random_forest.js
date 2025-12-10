// Importamos librerías propias, ajustar a cada circunstancia.
var l8 = require('users/jpperezalcantara/curso-gee:lib/landsat8');

/*

    Ejemplo de clasificación no supervisada con k-means.



*/

// Colección
var COLECCION = 'LANDSAT/LC08/C02/T1_L2';

// Filtro espacial
var AMBITO = geometry;

// Rango temporal
var FECHA_COMIENZO = '2023-01-01';
var FECHA_FIN = '2025-01-01';

// Cobertura nubosa máxima
var CLOUD_COVER_MAX = 10;

// Semilla aleatoria, para reproducibilidad.
var SEED = 0;

// Fracción de datos de entrenamiento reservados para validación.
var FRACCION_VALIDACION = 0.3;

// Número de árboles para el Random Forest.
var N_ARBOLES = 100;


// -----------------------------
// A partir de aquí el script

// Abrimos la colección
var landsat = ee.ImageCollection(COLECCION)
    .filterBounds(AMBITO)
    .filterDate(FECHA_COMIENZO, FECHA_FIN)
    .filter(ee.Filter.lt('CLOUD_COVER', CLOUD_COVER_MAX));

// Aplicamos la máscara de calidad.
landsat = landsat.map(l8.mascara_qa_pixel);

/*

    Preparamos los sets de entrenamiento a partir de lo que hemos
    definido sobre el mapa, creando una FeatureCollection con la
    clase apropiada.

*/
var zonas_entrenamiento = ee.FeatureCollection([
    ee.Feature(rio, {clase: 0}),
    ee.Feature(suelo_desnudo, {clase: 1}),
    ee.Feature(arrozal, {clase: 2}),
    ee.Feature(pluma_turbidez, {clase: 3}),
    ee.Feature(oceano, {clase: 4})
]);

print(zonas_entrenamiento);

/*

    Las bandas ópticas que van a definir el vector temático de la
    clasificación.

*/
var bandas = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5',
              'SR_B6', 'SR_B7'];

/*

    Clipeamos a la zona de interés (para que sea más rápido),
    sacamos la imagen mediana, seleccionamos las bandas K y
    visualizamos.

*/
var landsat_clip = landsat
    .median()
    .select(bandas)
    .clip(AMBITO);

// Visualizamos.
var visualizacion_color = {
    min: 3768.350741899525,
    max: 20234.064763854563,
    bands: ['SR_B5', 'SR_B4', 'SR_B3'],
};

Map.addLayer(landsat_clip, visualizacion_color, 'Mediana clip');

/*

    Extraemos el entrenamiento por las zonas definidas.

*/
var training = landsat_clip.sampleRegions({
    collection: zonas_entrenamiento,
    // Esto hace que la propiedad "clase" de las zonas se añada a
    // los datos del pixel extractado.
    properties: ["clase"],
    scale: 30,
    geometries: false
});

/*

    Como es costumbre en clasificaciones supervisadas, separamos
    la muestra de entrenamiento en dos partes: una para entrenar
    el modelo y otra para validarlo.

*/
// Añadimos a training una columna aleatoria entre 0 y 1.
var training = training.randomColumn('random', SEED);

// Filtramos en dos conjuntos según la fracción de validación.
var entrenamiento = training.filter(
    ee.Filter.lt('random', 1 - FRACCION_VALIDACION)
);
var validacion = training.filter(
    ee.Filter.gte('random', 1 - FRACCION_VALIDACION)
);

// print('Num. muestras entrenamiento', entrenamiento.size());
// print('Num. muestras validación', validacion.size());

/*

    Preparamos el modelo y lo entrenamos.

*/
var clasificador = ee.Classifier.smileRandomForest({
    numberOfTrees: N_ARBOLES,
    seed: SEED
}).train({
    features: entrenamiento,
    // La propiedad que controla la clase.
    classProperty: "clase",
    // Las propiedades en las que se basa la clasificación (las
    // bandas).
    inputProperties: bandas
});

/*

    Probamos la bondad del clasificador con una matriz de
    confusión.

*/
var validacionClasificada = validacion.classify(clasificador);

var matrizConfusion = validacionClasificada.errorMatrix(
    'clase', 'classification'
);

print('Matriz de confusión', matrizConfusion);
print('Exactitud global', matrizConfusion.accuracy());

/*

    Kappa (también conocida como Kappa de Cohen) es una divertida
    métrica que compara las predicciones del modelo frente a una
    asignación aleatoria de clases. Un valor de 1 es máxima
    coincidencia, lo más alejado posible de la aleatoriedad. Un
    valor de 0 dice que tu modelo es igual de bueno que elegir
    aleatoriamente clases y un valor negativo indica que un mono
    con dos pistolas es un predictor más fiable que tu modelo.

*/
print('Kappa', matrizConfusion.kappa());

/*

    En función del papel o peso que cada variable ha tenido en la
    construcción de los árboles que componen el bosque, podemos
    obtener una estimación de qué bandas son las que producen en
    global más branching en la toma de decisiones, es decir,
    cuáles son las bandas que están controlando más la
    clasificación.

*/
var explicacion = clasificador.explain();
print('Importancia de variables', explicacion.get('importance'));

/*

    Finalmente aplicamos el clasificador a la imagen completa
    (clipeada a la zona de interés) para obtener la
    clasificación final.

*/
var clasificacion = landsat_clip.classify(clasificador)
    .rename('clase');

/*

    Y visualizamos con un mapa de colores fijo para las clases.

    El número de colores en la paleta debe coincidir con el
    número de clases definidas en las zonas de entrenamiento.

*/
var paleta_clases = [
    "111149",
    "cc0013",
    "cdb33b",
    "d7cdcc",
    "aec3d4",
];

Map.addLayer(
    clasificacion,
    {
        min: 0,
        // Ajustamos el máximo automáticamente al número de
        // "features" de entrenamiento menos 1.
        max: zonas_entrenamiento.size().subtract(1).getInfo(),
        palette: paleta_clases
    },
    'Clasificación Random Forest'
);

/*

    Exportamos las zonas de entrenamiento como GeoJSON a Drive.

*/
Export.table.toDrive({
    collection: zonas_entrenamiento,
    description: 'zonas_entrenamiento',
    folder: 'Google Earth Engine',
    fileNamePrefix: 'zonas_entrenamiento',
    fileFormat: 'GeoJSON'
});
