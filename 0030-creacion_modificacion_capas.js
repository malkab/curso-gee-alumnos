/* ------------------------------

    Creación y modificación de capas.

------------------------------ */

/*

    GEE nos permite operar con las bandas de una colección de
    imágenes para modificar los valores de las mismas o para
    crear nuevas bandas a partir de las existentes, como por
    ejemplo para calcular índices.

    Para llegar a hacer estas operaciones es capital que
    entendamos el concepto de FUNCIÓN. La función es el mínimo
    bloque jerárquico organizativo del código de una aplicación
    no trivial en prácticamente todos los lenguajes de
    programación.

    Al igual que su homólogo matemático, una función es un bloque
    de código que realiza una tarea concreta y que puede recibir
    entradas (argumentos) y devolver salidas (valores de
    retorno). Así como la función de una recta (y = ax+b) recibe
    una variable independiente "x" que es modificada para obtener
    la variable dependiente "y", en programación una función
    puede recibir uno o varios "argumentos" que son procesados
    para devolver un valor (o varios) de retorno.

    Las ventajas de usar funciones se hacen obvias con la
    práctica de la programación:

    - Permiten organizar el código en bloques lógicos, cada uno
      con una tarea concreta.

    - Permiten reutilizar código, ya que una función puede ser
      llamada (invocada) tantas veces como se necesite desde
      cualquier parte del programa.

    - Permiten parametrizar el código, ya que las funciones
      pueden recibir diferentes argumentos para modificar su
      comportamiento.

    Cualquier programa o script no trivial contará con varias
    funciones. Las funciones pueden ser agrupadas en librerías o
    módulos que pueden ser importados y usados en los programas
    principales, siendo por lo tanto código portable y
    reutilizable.

    En programas complejos, por encima de las funciones, se
    encuentran otras estructuras jerárquicas de mayor rango como
    las clases, como en el caso de la programación orientada a
    objetos, pero eso es un tema complejo que queda fuera del
    alcance de este curso.

    Veamos una función sencilla que suma dos números:

*/
function suma(a, b) {
    return a + b;
}

/*

    Nótese la estructura de la función:

    - La palabra clave "function" que indica que estamos
      definiendo una función.

    - El nombre de la función, en este caso "suma".

    - Los argumentos entre paréntesis, en este caso "a" y "b",
      los dos números a sumar.

    - El cuerpo de la función entre llaves { }, que contiene las
      instrucciones que definen la tarea que realiza la función.
      En este caso, una sola instrucción que devuelve la suma de
      los dos argumentos usando la palabra clave "return".

    De especial importancia es la palabra clave (o reservada,
    también se llaman) "return". Cuando el código de una función
    se ejecuta, lo normal es llegar tarde o temprano a un
    "return" (puede haber varios). En cuanto se alcanza uno, la
    función devuelve al código cliente el valor designado y el
    programa transfiere el control del flujo de ejecución de
    nuevo al código cliente.

    GEE leerá este código pero no hará nada, simplemente guardará
    en su memoria la función para su posterior uso.

    Las funciones se INVOCAN en el cuerpo principal del script.
    Desde el punto de vista técnico, se dice que el código de la
    función es código "servidor" (ya que sirve un propósito
    computacional) mientras que el código que usa e invoca a la
    función es código "cliente".

    Por lo tanto, una vez definida la función, la invocamos desde
    nuestro "código cliente", es decir, el cuerpo principal del
    script:

*/
var resultado = suma(3, 5);

print("El resultado de la suma es: ", resultado);

/*

    Es muy, muy, muy importante entender que UNA FUNCIÓN ES LO
    QUE DEVUELVE. Es decir, la función anterior, que devuelve un
    número, puede ser compuesta contra otras funciones o números
    para hacer operaciones numéricas. Por ejemplo, definamos otra
    función que multiplica dos números:

*/
function multiplica(a, b) {
    return a * b;
}

/*

    Ahora podemos componer ambas funciones para hacer una suma y
    luego multiplicar el resultado por otro número:

*/
var resultado2 = multiplica(suma(2, 4), 10);

print("El resultado de la suma y multiplicación es: ", resultado2);

/*

    Este código funciona porque la función "multiplica()" espera
    recibir como parámetros dos números, y la función "suma()"
    devuelve un número (es decir, podemos considerar que, si todo
    va bien dentro de su código y el "return" se alcanza sin
    emitirse ningún error, "suma()" ES un número), por lo que
    multiplica() acaba recibiendo lo que necesita: dos números con
    los que operar. El lenguaje se encarga de evaluar la sintáxis
    y saber qué función tiene que ejecutar primero.

    Así:

*/
var resultado3 = multiplica(suma(2, 4), 10) + 100;

print("El resultado de la suma, multiplicación y suma final es: ", resultado3);

/*

    Es un código perfectamente válido, ya que son operaciones
    entre funciones que son números más un literal, que así es
    como se llama en ingeniería a los valores numéricos o
    alfanuméricos escritos "a las bravas" en el código, que
    también es un número (100).

    Pues bien, saber escribir buenas funciones es una habilidad
    adquirible y entrenable con la práctica y es una de las bases
    de la programación. Más o menos, una buena función:

    - Debe hacer una sola cosa (principio de responsabilidad
      única). No escribimos funciones que hacen dos cosas. Sólo
      una. Escribimos dos funciones mejor que una en ese caso.
      Las funciones con un único propósito son más simples, más
      fáciles de entender y recordar, más portables a otros
      proyectos y, en suma, más reutilizables, que, en última
      instancia, es de lo que se trata: códido de calidad
      reutilizable.

    - Debe tener un nombre descriptivo que indique claramente qué
      hace la función.

    - Debe recibir los argumentos necesarios para hacer su tarea,
      ni más ni menos.

    - Debe estar documentada con comentarios que expliquen qué
      hace, qué argumentos recibe y qué valor devuelve. Porque
      mañana ni tú mismo te acuerdas de qué hacía, que nos
      conocemos.

    Para ejemplificar cómo podemos utilizar funciones para crear
    o modificar las capas de una imagen vamos a calcular los
    valores de reflectividad reales de las bandas Landsat 8.

    Por motivos computacionales y de almacenamiento, las bandas
    Landsat se guardan originalmente como números enteros de 16
    bits. A los microprocesadores les gusta mucho los números
    enteros, los manejan con soltura. Como los niños de primaria,
    cuando ven decimales se disgustan, y se vuelven lentos.

    Así que el USGS nos dice que apliquemos la siguiente fórmula
    a los valores enteros de 16 bits si queremos obtener los
    valores de reflectancia reales:

    Reflectancia = DN * 0.0000275 - 0.2

    Ojito con ese offset de -0.2 que es importante, ya que rompe
    la linealidad de los valores de las capas y es demoledor a la
    hora de calcular índices.

    Vamos a escribir una función que aplique esa fórmula a las
    bandas de una imagen:

*/
function escalaL8(image) {
    var bandas_opticas = image.select('SR_B.')
        .multiply(0.0000275)
        .add(-0.2);

    return coleccion.addBands(bandas_opticas, null, true);
}

/*

    Nótese el select('SR_B.'). Ese misterioso "SR_B." es una
    "expresión regular". Las expresiones regulares son cadenas de
    caracteres con una sintaxis diseñada en el Séptimo Infierno
    que crean patrones que se confrontan contra otras cadenas de
    caracteres para acabar arrojando un "la cadena cumple el
    patrón, o no".

    Esta es de las facilonas: el punto (.) significa "cualquier
    carácter" y la SR_B es literal. Por lo tanto, 'SR_B.'
    significa "cualquier banda que empiece por SR_B", es decir,
    todas las bandas de superficie reflectante (SR) de Landsat 8.

    Así que imagen.select('SR_B.') está seleccionando todas las
    capas que pueda traer la colección de imágenes que empiecen
    por 'SR_B'.

    A los valores de los píxeles de esas bandas se les multiplica
    por 0.0000275 y se le añade el offset de -0.2, guardando el
    resultado en una colección temporal llamada "bandas_opticas".

    Finalmente, la función devuelve la imagen original con las
    nuevas bandas añadidas, usando el método addBands(). El
    segundo parámetro es null porque no queremos renombrar las
    bandas (se quedan con su nombre original) y el tercer
    parámetro es true para indicar que si las bandas ya existen
    (que existen) se sobreescriban con los nuevos valores.

    El resultado final es una colección en la que las bandas
    SR_Bx tienen los valores de reflectancia reales.

    Vamos a ver cómo se pone en práctica:

*/
var capas = ["SR_B5", "SR_B4", "SR_B3"]

// Cargamos la colección filtrada.
var landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterDate('2018-01-01', '2019-01-01')
    .filterBounds(geometry)
    .select(capas)
    .filterMetadata("CLOUD_COVER", "less_than", 10);

/*

    Esta colección landsat viene con los píxeles con valores de
    16 bits. Lo comprobamos sobre la primera de las imágenes de
    la colección. Para ello vamos a utilizar un reductor de
    región, es decir, un extractor zonal de estadísticas sobre la
    imagen:

*/
var minMax = landsat.first().reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: geometry,
  scale: 30,
  maxPixels: 1e9
});

print(minMax)

/*

    .reduceRegion() coge la región definida por la geometría
    (puede ser un punto, una línea o un polígono) y extrae
    (reduce) estadísticas sobre la imagen. En este caso, el
    reductor es minMax(), que devuelve el máximo y el mínimo (hay
    muchos más). "scale" es la escala de la imagen (30 para
    Landsat, aunque puede ser mayor para que vaya más rápido si
    la zona es grande y no nos importa perder algo de precisión).
    maxPixels limita el número de píxeles a leer para no
    extralimitarnos en computación (estamos de prestados,
    recordad).

    Aplicamos la función de escalado:

*/
var landsat_escalado = landsat.map(escalaL8);

// Comprobamos los nuevos valores:
var minMax_escalado = landsat_escalado.first().reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: geometry,
  scale: 30,
  maxPixels: 1e9
});

print(minMax_escalado)
