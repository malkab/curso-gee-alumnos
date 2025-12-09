/*

    Técnicas de visualización de capas.

*/

/*
    Como geometría de la zona de interés, dibujamos una línea a lo
    largo de la costa desde el Algarve hasta el Estrecho.

*/

// Cargamos la colección.
var landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterDate('2018-01-01', '2019-01-01')
    .filterBounds(geometry)
    .select(["SR_B4", "SR_B3", "SR_B2"])
    .filterMetadata("CLOUD_COVER", "less_than", 10);

/*
    Esta estructura de datos se llama en JavaScript "diccionario".
    Un diccionario es una estructura de datos que permite
    almacenar, entre { }, pares "clave: valor", separados por
    comas. Es muy normal que las funciones de GEE admitan como
    argumentos diccionarios con una estructura de datos concreta.

*/
var visualizacion = {
    // Las bandas que queremos ver, en los canales RGB.
    bands: ['SR_B4', 'SR_B3', 'SR_B2'],
    // El valor mínimo y máximo que se asigna para el stretching
    // de visualización.
    min: 0,
    max: 20000
}

/*

    "Map" es un objeto global que representa el mapa de
    visualización en GEE. El método "addLayer" añade una capa
    al mapa. Recibe tres argumentos:

    1. La imagen o colección a visualizar.

    2. Un diccionario con los parámetros de visualización.

    3. El nombre de la capa para mostrar en el panel de capas.

*/
Map.addLayer(landsat, visualizacion, "RGB")

/*

    Centramos el mapa en la geometría que hemos dibujado,
    con un nivel de zoom 8.

*/
Map.centerObject(geometry, 8);

/*

    La cuestión es... si la colección tiene varias imágenes, ¿cómo
    se visualizan todas a la vez? Por defecto, GEE hace un
    "mosaic" simple, es decir, superpone las imágenes en el orden
    en que están en la colección, de modo que las imágenes que van
    después tapan a las anteriores, de forma que vemos las
    imágenes más recientes.

    Podemos controlar el orden de apilamiento de las imágenes
    ordenando la colección antes de visualizarla. Por ejemplo,
    podemos ordenar la colección por fecha, de modo que las más
    recientes queden encima:

*/
Map.addLayer(
    landsat.sort('system:time_start').mosaic(),
    visualizacion,
    "Mosaic: más recientes"
);

// O lo contrario, las más antiguas encima:
Map.addLayer(
    landsat.sort('system:time_start', false).mosaic(),
    visualizacion,
    "Mosaic: más antiguas"
);

/*

    O podemos ordenar la colección por cobertura de nubes, de
    modo que las imágenes con menos nubes queden encima:

*/
Map.addLayer(
    landsat.sort('CLOUD_COVER', false).mosaic(),
    visualizacion,
    "Mosaic: menos nubes"
);

Map.addLayer(
    landsat.sort('CLOUD_COVER').mosaic(),
    visualizacion,
    "Mosaic: más nubes"
);

/*
    Ver una imagen específica de la colección necesita un poquito
    más de código. Primero, hay que transformar la colección en un
    objeto de JavaScript de tipo "lista" o "array", que es una
    estructura de datos indexada por posición numérica:

*/
var lista_landsat = landsat.toList(4);

/*
    Obsérvese el parámetro "4": es el número máximo de imágenes
    que queremos en la lista, con lo que hará una lista con las
    primeras 4 imágenes. Esto puede ser útil o no, lo normal es
    crear una lista con todas las imágenes, pero si la colección
    es muy grande puede ser que falle la operación por exceso de
    demanda de computación:

*/
var lista_landsat = landsat.toList(landsat.size());

/*
    Ahora podemos extraer la imagen que queramos de la secuencia.
    Recordemos que las listas en JavaScript se indexan desde 0:

*/
var imagen_2 = ee.Image(lista_landsat.get(2));

// La visualizamos:
Map.addLayer(imagen_2, visualizacion, "Imagen 2");

/*

    Podemos calcular una imagen resumen de la colección con una
    familia de funciones que se llaman "reductores", porque hacen
    precisamente eso, aplanar la estructura de la colección a una
    sóla imagen. Usamos por ejemplo la mediana:

*/
var imagen_mediana = landsat.median();

// La visualizamos:
Map.addLayer(imagen_mediana, visualizacion, "Mediana");

// Observemos la imagen resultante:
print(imagen_mediana);

/*

    Ejercicio:

    Buscar en la documentación y probar otras funciones
    reductoras para la colección.

    Crear y visualizar imágenes en falso color.

*/