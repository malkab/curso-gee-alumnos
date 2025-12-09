/*

    Manejo de colecciones de imágenes.

*/

/*

    Esto es una llamada a la API de datos de Google Earth Engine,
    que está en el objeto principal "ee".

    ImageCollection es un método básico de ee que accede a una
    colección del catálogo de datos de Earth Engine, en este
    caso, el Tier 1 de Landsat 8.

*/
ee.ImageCollection("LANDSAT/LC08/C02/T1_L2");

/*

    Llamar así a la API no sirve de gran cosa, puesto que no
    estamos guardando el resultado en la memoria de GEE:

*/
var landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2");

// Examinamos el objeto colección "landsat":
print(landsat);

/*

    Y nos fallará, puesto que el objeto es demasiado grande. Por
    lo tanto nos limitaremos a llamar al método size() del
    objeto colección, que nos devolverá el número de imágenes
    que contiene:

*/
print(landsat.size());

/*

    Es muy complejo trabajar con la colección completa, así que
    tenemos que ir aplicando filtros para quedarnos con un set
    limitado de imágenes presentes en la colección.

*/

/*
    Vamos a aplicar primero el filtro por rango temporal. Cosas a
    notar:
    - las fechas van en formato ISO (YYYY-MM-DD)
    - el filtro es inclusivo en la fecha inicial y exclusivo en la
      fecha final, que es lo usual en ingeniería
    - persistimos la colección filtrada en una nueva variable que
      se llama igual que la anterior, sobreescribiéndola en
      memoria
*/
landsat = landsat.filterDate('2018-01-01', '2019-01-01');

print(landsat.size());

/*
    Ahora es usual meter un filtro espacial por un área de
    interés. Para ello dibujamos un punto en la zona de Doñana,
    por ejemplo.

    Nótese que el editor de código de GEE ha creado una variable
    al principio del código llamada "geometry" que contiene el
    punto que hemos dibujado en el mapa. Usamos esa variable
    para filtrar la colección por el área de interés:
*/
landsat = landsat.filterBounds(geometry);

print(landsat.size());

// Cogemos y examinamos la primera imagen:
var img_0 = landsat.first();
print(img_0);

/*

    Vamos bajando el tamaño de la colección y por tanto la demanda
    de computación a solicitar a GEE.

    También podemos seleccionar las bandas que nos interesan. En
    este caso, las bandas 4, 3 y 2 (roja, verde y azul) de la
    superficie reflectante (SR) de Landsat 8:

*/
landsat = landsat.select(["SR_B4", "SR_B3", "SR_B2"]);

print(landsat.size());

/*
    Ahora que la colección es más manejable, podemos examinarla en
    la consola y estudiar su estructura de datos:

*/
print(landsat);

/*
    Un último filtro habitual es el de cobertura de nubes, que en
    el caso de la estructura de datos de Landsat 8 está en el una
    propiedad (metadata) llamada "CLOUD_COVER". Vamos a quedarnos
    con las imágenes que tengan menos de un 40% de nubes:

*/
landsat = landsat.filterMetadata("CLOUD_COVER", "less_than", 40);

print(landsat);

/*

    Para hacer el código más compacto y legible, dado que todos
    los métodos vistos anteriormente devuelven una nueva colección, se
    pueden encadenar todos los filtros en una sola asignación:

*/
var coleccion = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterDate('2018-01-01', '2019-01-01')
    .filterBounds(geometry)
    .select(["SR_B4", "SR_B3", "SR_B2"])
    .filterMetadata("CLOUD_COVER", "less_than", 20);

print(coleccion);

/*

    Ejercicio:

    Crear una colección de imágenes de Sentinel-2 filtrada y
    explorar su estructura de datos.

*/
