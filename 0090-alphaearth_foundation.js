/*

    AlphaEarth Foundations

    Para comenzar a tirar del hilo:

    https://deepmind.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/

    El catálogo de Google Earth Engine no sólo contiene
    información de sensores multiespectrales. Si lo examinamos
    con detalle, encontraremos datos climatológicos,
    hidrológicos, productos consolidades de discriminación de
    coberturas, etc. Obviamente, con Google Earth Engine podemos
    aplicar el álgebra ráster que utilizamos normalmente en
    nuestro día a día en sistemas de escritorio como QGIS, sólo
    que escribiendo código (¡reproducibilidad de la ciencia!).

    Pero sin duda el producto más novedoso del catálogo, y que de
    seguro es el primero de muchos productos similares, más
    específicos temáticamente, es AlphaEarth Foundations.


    ¿Qué es AlphaEarth Foundations?

    AlphaEarth es un "LLM geofísico". Es decir, es más o menos
    utilizar la técnica que se utiliza en el entrenamiento de un
    gran modelo de lenguaje como ChatGPT pero aplicado al
    espacio, a un "lenguaje geofísico". En lugar de reconocer
    patrones de texto, AlphaEarth ha sido entrenado para
    reconocer patrones geofísicos.


    ¿Qué periodo temporal abarca?

    Han entrenado el modelo con información desde 2017 hasta 2023
    (ambos inclusive). La resolución temporal es anual.


    ¿Con qué datos se ha entrenado?

    No lo sé muy bien, pero conociendo a esta gente, con todo lo
    que han pillado. Todas las imágenes de satélite de los
    distintos sensores, productos derivados de reconocida
    calidad, etc.


    ¿Cómo se entrena?

    Como siempre, primero hay que preparar los datos. Se crea una
    malla mundial de 10 metros de resolución que va a ser el
    "píxel" básico, la unidad mínima de información y anclaje
    territorial del juego de datos.

    Sobre esa rejilla se suporpone todo lo que se quiere
    incorporar al entrenamiento y se le da un valor al píxel en
    función de la geometría de esa superposición. Esto acaba
    generando, para cada píxel, un vector de datos de cientos de
    miles de dimensiones.

    Por ejemplo, está entrenado con datos de presencia de
    especies vegetales clave en cada bioma. Así, cuando
    asimilemos sobre la rejilla la presencia de la especie X, que
    es de regiones templadas, obtendremos un datos sobre la
    superficie de 10 m2 que ocupa dicha especie en cada píxel.
    Como es de esperar, la enorme mayoría de los píxeles del
    mundo no tendrán presencia de dicha especie, por lo que lo
    tendrán a 0. Y así con cientos de miles de variables.

    Esto nos deja con algo que en IA se llama un "sparse vector"
    (vector disperso o laxo), es decir, un vector con cientos de
    miles de componentes pero de las cuales sólo algunas poquitas
    están a valores distintos de 0.

    Con esto es difícil trabajar. Establecer métricas de
    distancia (y, por tanto, de similaridad) entre vectores tan
    dispersos es farragoso y poco efectivo. Son difíciles de
    indexar y esos ceros ocupan mucho espacio.

    Lo que se hace entonces es aplicar una técnica de reducción
    de dimensionalidad aplicando una red neuronal que se llama el
    "encoder" (codificador). Esta red neuronal aprende los
    patrones encontrados en los sparse vectors y los deja, en el
    caso de Alpha, en vectores de 64 dimensiones. Esto es lo que
    se conoce como un "embedding" o "dense vector" (vector
    denso), por no tiene (muy probablemente) valores 0 en sus
    componentes.

    Esta RN encoder va acompañada de una antagonista, otra RN que
    se denomina "decoder" (decodificador), cuyo trabajo es
    intentar restaurar el vector disperso original a partir del
    embedding. Es como un doble embudo: primero condensamos de
    cientos de miles de dimensiones a 64, y luego intentamos
    volver a expandir esos 64 a cientos de miles.

    Obviamente no el vector de salida no es perfectamente igual
    al original, pero si la RN está bien entrenada, la pérdida de
    información es asumible para muchos usos.

    Pero lo que tiene valor es el embedding de 64 dimensiones. Al
    terminar el trabajo, se guardan tres cosas: el encoder, el
    decoder y la ingente colección de embeddings para cada píxel
    10x10 del mundo. Los embeddings ya tienen un tamaño muy
    razonable y, sobre todo, al ser pequeños, son fácilmente
    indexables y la función distancia entre ellos es efectiva y
    muy fácil de calcular. Ya existen bases de datos
    especializadas en este tipo de datos, las bases de datos de
    embeddings o vectoriales (no en el sentido geográfico, sino
    matemático) que traen incorporados potentes índices para la
    gestión y búsqueda de este tipo de vectores y, lo que es más
    importante, funciones distancia ultra rápidas para encontrar
    los vectores que se parecen a un vector objetivo dentro de un
    margen de confianza. Así es como Amazon pasa de recomendarte,
    la primera vez que entras, discos de Paquita Rico a lo que
    realmente te gusta con haber comprado sólo una cosa.

    Los embeddings no se pueden interpretar directamente. Forman
    parte de la oscura mente de las redes neuronales profundas
    artificiales (Deep Neural Networks, DNN), y su significado es
    inescrutable. Pero en sus componentes numéricas queda
    codificada, como en nuestro cerebro, la "intuición", la
    "sensación", de que dos cosas obedecen a patrones similares
    en lo que realmente es importante. Es más bien un "instinto",
    como cuando nosotros no tenemos que pensar algo
    concienzudamente.

    Por lo tanto, los embeddings responden preguntas del tipo "no
    me preguntes por qué pero estas dos cosas tienen un aire o se
    parecen como un huevo a una castaña".

    Esto, bien utilizado, es una herramienta extremadamente
    poderosa. Es destilar la esencia de la información geofísica
    en un paquetito de datos manejable, eficiente y preparado
    para un tratamiento masivo. Y es la base de razonamientos más
    avanzados y sofisticados.

*/

// Años que va a abarcar el análisis (básicamente la colección completa).
var ANYO_0 = ee.Number(2017);
var ANYO_1 = ee.Number(2024);

// Colección AlphaEarth.
var COLECCION = 'GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL';

// Ámbito de referencia.
var AMBITO = geometry;

// -----------------------------
/*

    Cargamos la colección AlphaEarth.

*/
var alpha = ee.ImageCollection(COLECCION)
    .filter(ee.Filter.calendarRange(ANYO_0, ANYO_1, 'year'))
    .filterBounds(AMBITO);

// Añadimos la mediana para visualización.
Map.addLayer(alpha.median().clip(AMBITO), {}, "Alpha");

/*

    Vamos a definir una función que calcule el cambio interanual.
    El argumento n es el añadido en años a analizar desde el año
    ANYO_0.

*/
function cambioAnual(n) {

    // Sacamos las dos fechas del intervalo.
    var anyo_0 = ee.Date.fromYMD(ANYO_0.add(n), 1, 1);
    var anyo_1 = anyo_0.advance(1, 'year');

    // Segmentamos el alpha del primer año...
    var alpha_0 = alpha
        .filterDate(anyo_0, anyo_1)
        .filterBounds(AMBITO)
        .median();

    // ...y del segundo.
    var alpha_1 = alpha
        .filterDate(anyo_1, anyo_1.advance(1, 'year'))
        .filterBounds(AMBITO)
        .median();

    /*

        Cálculo de la similaridad entre ambos años. Puesto que
        las 64 dimensiones del embedding están normalizadas
        (vector unitario), el producto escalar entre ambos
        vectores nos da una medida de similaridad entre 0
        (completamente diferentes) y 1 (idénticos). Esto se
        conoce también como la distancia del coseno, puesto que
        es equivalente a calcular el coseno del ángulo que forman
        ambos vectores en el espacio multidimensional.

    */
    var similaridad = alpha_1.multiply(alpha_0)
        .reduce(ee.Reducer.sum())
        .rename("similaridad");

    /*

        Creamos desde cero una imagen inicializada a 1 y le
        restamos la similaridad para obtener la magnitud opuesta,
        es decir, el cambio.

        Como referencia temporal le añadimos el system:time_start
        del año que cierra el periodo, para poder hacer
        posteriormente análisis gráfico de la serie temporal. Si
        las imágenes no llevan este system:time_start, el gráfico
        de análisis temporal se niega a funcionar.

    */
    var cambio = ee.Image(1)
        .subtract(similaridad)
        .rename("cambio")
        .set('anyo_inicial', anyo_0.get('year'))
        .set('anyo_final', anyo_1.get('year'))
        .set('system:time_start', ee.Date(anyo_1).millis());

    // Devolvemos la imagen de cambio.
    return cambio;

}

/*

    Creamos una lista secuencia de los deltas de avance de año
    (de 0 a la diferencia entre ANYO_1 y ANYO_0 menos 1) y la
    mapeamos con la función de cálculo de cambio anual definida
    antes.

*/
var cambios = ee.ImageCollection(
    ee.List.sequence(0, ANYO_1.subtract(ANYO_0).subtract(1))
        .map(cambioAnual)
);

print("Colección de cambios", cambios);

// Visualizamos los resultados de cambio máximo y mediana.
Map.addLayer(
    cambios.max(),
    { palette: ['white', 'red'] },
    "Cambios máximos"
);

Map.addLayer(
    cambios.median(),
    { palette: ['white', 'red'] },
    "Cambios mediana"
);

// Componemos un gráfico de la serie temporal.
var chart = ui.Chart.image.series({
    imageCollection: cambios,
    region: geometry2,
    reducer: ee.Reducer.mean(),
    scale: 10
}).setOptions({
    title: 'Serie temporal de cambios según AlphaEarth',
    hAxis: { title: 'Fecha' },
    vAxis: { title: 'Cambio' },
    lineWidth: 2,
    pointSize: 3
});

print(chart)