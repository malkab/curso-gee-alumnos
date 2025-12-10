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

// Número de clústeres a obtener
var N_CLUSTERS = 2;


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

    Vamos a realizar la clusterización K-means basado en un
    vector temático compuesto por las bandas ópticas.

*/
var bandas_k = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5',
                'SR_B6', 'SR_B7'];

/*

    Clipeamos a la zona de interés (para que sea más rápido),
    sacamos la imagen mediana, seleccionamos las bandas K y
    visualizamos.

*/
var landsat_clip = landsat
    .median()
    .select(bandas_k)
    .clip(AMBITO);

var visualizacion_color = {
    min: 3768.350741899525,
    max: 20234.064763854563,
    bands: ['SR_B5', 'SR_B4', 'SR_B3'],
};

Map.addLayer(landsat_clip, visualizacion_color, 'Mediana clip');

/*

    Ahora tenemos que coger una muestra de nuestra zona de
    estudio para entrenar el clasificador K-means.

*/
var training = landsat_clip.sample({
    // Área de muestreo
    region: AMBITO,
    // Resolución Landsat
    scale: 30,
    // Número de píxeles a muestrear
    numPixels: 10000,
    // Seed aleatoria para reproducibilidad, eliminar para un
    // muestreo no determinista.
    seed: 0
});

// Vemos los primeros 5 vectores de la muestra de entrenamiento.
print('Training sample', training.limit(5));

/*

    Entrenamos el clusterizador K-means con el número de
    clústeres definido.

*/
var clusterer = ee.Clusterer.wekaKMeans(N_CLUSTERS)
                    .train(training);

// Aplicamos el clusterizador a la imagen
var clusters = landsat_clip.cluster(clusterer);

/*

    Creamos una paleta de colores fijos para visualizar los
    clústeres siempre con los mismos colores. Aunque la
    asignación de número de clústeres a clases es no
    determinista, al menos los colores serán los mismos en
    función del número de clúster.

    Aguanta hasta 10 clústeres (más allá los resultados son
    difícilmente intepretables).

*/
var paleta_clusteres = [
  '1f78b4', // 0
  '33a02c', // 1
  'e31a1c', // 2
  'ff7f00', // 3
  '6a3d9a', // 4
  'b15928', // 5
  'a6cee3', // 6
  'b2df8a', // 7
  'fb9a99', // 8
  'fdbf6f'  // 9
];

// Visualizamos.
Map.addLayer(
    clusters,
    // Metemos directamente las características de visualización.
    {
        // El mínimo clúster es siempre 0.
        min: 0,
        // El máximo depende del número de clústeres.
        max: N_CLUSTERS - 1,
        // La paleta de antes.
        palette: paleta_clusteres
    },
    'Clústeres'
);

/*

    Vamos a sacar un poco de estadística para describir estos
    clústeres para intentar entenderlos mejor.

    Vamos a utilizar al set de entrenamiento para ello.

    Primero sometemos al propio set de entrenamiento al modelo de
    clustering para saber a qué clúster pertenecen.

*/
// Sometemos al set de entrenamiento del clusterizador al propio
var training_cluster = training.cluster(clusterer);

print(training_cluster.limit(5));

/*

    Nótese que el tipo de dato de training_cluster es un
    FeatureCollection. Un FeatureCollection es una colección de
    "features", que son entidades vectoriales con atributos
    asociados. Al igual que los ImageCollection, los
    FeatureCollection tienen un montón de métodos para operar
    sobre ellos.

    En nuestro caso, los "features" de training_cluster no tienen
    información espacial y sólo tienen atributos ("properties")
    con los valores de los píxeles muestreados para cada banda
    óptica. Además tienen el valor del clúster asignado.

    Vamos a crear un reductor de medias que agrupa por el clúster
    los valores de las bandas ópticas.

    Por lo tanto, el punto de partida es que, si tenemos X
    píxeles muestreados, entonces tenemos 7 series numéricas de
    longitud indeterminada (una por cada banda óptica) a la que
    queremos hacerle la media previa agrupación por clústers.

    Los reducers siempre son un fastidio, no son fáciles de
    entender.

    Primero declaramos que vamos a utilizar un reductor de medias
    (ee.Reducer.mean()).

    Pero como queremos aplicar este reductor a varias bandas,
    tenemos que replicarlo (.repeat) tantas veces como series
    numéricas queramos reducir con la media. Como tenemos 7
    bandas ópticas, preparamos el reductor para operar
    simultáneamente sobre las 7 series. Por eso el repeat lleva
    como argumento el tamaño de la lista de bandas_k.

    Finalmente, el reductor necesita una lógica de agrupamiento.
    Necesita que le indiquemos el índice de la columna de la
    estructura de datos que definiremos posteriormente que
    contiene columna que controlará el agrupamiento. Dejamos 0
    puesto que nos las vamos a ingeniar para que el clúster,
    controlador del agrupamiento, sea la primera columna.

*/
var reducer = ee.Reducer.mean()
    .repeat(bandas_k.length)
    .group({
        groupField: 0,               // index in selectors = 'cluster'
        groupName: 'cluster'
    });

/*

    Ahora vamos a aplicar el reductor sobre la FeatureCollection
    utilizando su método reduceColumns.

    Este método necesita dos argumentos:

    - selectors: una lista con los nombres de las columnas
      (propiedades) que queremos reducir. En nuestro caso, la
      primera columna es el clúster (controlador del
      agrupamiento) y las siguientes son las bandas ópticas.

    - reducer: el reductor que hemos definido antes.

    El resultado es una estructura de datos que contiene, para
    cada clúster, la media de cada banda óptica.

    "selectors" es una lista con la selección de las columnas a
    reducir. Debe incluir tanto la columna que se ha definido en
    el reductor anterior como controladora del agrupamiento como
    las columnas a reducir. Reordenamos por tanto la lista de
    columnas de forma que ponemos primero a "cluster"
    (controlador del agrupamiento) y después la lista de las
    bandas ópticas. "concat()" es un método de listas que une dos
    listas, por eso ["cluster"] se define como una lista inicial
    de un único elemento.

    Nótese que el número de columnas de este selector debe ser
    UNO más que el .repeat() del reductor, ya que la primera
    columna, "cluster", controladora de la lógica de
    agrupamiento, no cuenta a este fin.

    Por otro lado, la reordenación de columnas poniendo a
    "cluster" como primer elemento (índice 0) es necesaria porque
    en el reductor hemos definido que la lógica de agrupamiento
    será controlada por la columna precisamente en esa posición.

    En fin, una API muy potente pero con un diseño un poco
    convoluto al que hay que acostumbrarse. Este tipo de diseños
    de API es muy común en todas las aplicaciones y librerías de
    Big Data, donde los reductores son una pieza clave en la
    arquitectura y están diseñados para ser flexibles y
    ultraoptimizados, pagando el precio de una innegable curva de
    entrada bastante empinada.

*/
var agrupamiento_por_cluster = training_cluster.reduceColumns({
  selectors: ['cluster'].concat(bandas_k),
  reducer: reducer
});

/*

    El resultado es una estructura de datos en la que los grupos
    tienen los nombres de los clústeres y cada uno contiene una
    lista de 7 elementos (número de bandas ópticas) con la media de
    cada banda para el grupo (clúster).

*/
print(agrupamiento_por_cluster);
