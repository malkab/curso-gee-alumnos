/*

    Creación de un módulo o librería.

    Cuando vamos acumulando una serie de funciones, como es el
    caso de las funciones para map() que calculan el NDVI o la
    reflectancia del Landsat 8, y está claro que dichas funciones
    pueden ser reutilizadas en otros proyectos, es buena idea
    agruparlas en un módulo o librería.

    Un módulo en GEE es simplemente un archivo JavaScript que
    contiene funciones y variables que queremos reutilizar. La
    idea es que podamos importar ese módulo en otros scripts y
    usar las funciones y variables que contiene.

    Para crear un módulo, simplemente creamos un nuevo archivo
    JavaScript en GEE (por ejemplo, "lib.js") y definimos las
    funciones y variables que queremos exportar. Luego, al final
    del archivo, usamos la palabra clave "exports" para
    especificar qué funciones y variables queremos hacer
    disponibles para otros scripts.

*/

/*

    El proceso de transformación de una función "normal" en una
    función reutilizable de módulo es sencilla. Tomemos como
    ejemplo la función para calcular el NDVI del módulo anterior:

*/
function calcularNDVI(image) {
    var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4'])
                    .rename('NDVI');
    return image.addBands(ndvi);
}

/*

    Para convertirla en una función exportable desde un módulo
    hay que variar ligeramente la sintaxis de su definición:

*/
exports.calcularNDVI = function(image) {
    var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4'])
                    .rename('NDVI');
    return image.addBands(ndvi);
}

/*

    En un fichero, todo lo que cuelgue del objeto especial
    "exports" será tenido en cuenta por GEE como un objeto,
    función o constante, utilizable e importable en otros
    scripts.

    Nótese que no sólo las funciones pueden ser exportadas, sino
    también constantes, información codificada en "duro" de
    referencia. Por ejemplo, si quisiéramos tener el número PI
    accesible siempre con el mismo valor, podriamos convertirlo
    en una constante exportable:

*/
exports.PI = 3.14159265359;

/*

    (Por convención, en muchísimos lenguajes de programación, las
    constantes se escriben en mayúsculas).

    Un módulo puede contener dentro funciones que no se expongan
    pero que sean necesarias para la operativa interna del propio
    módulo. Sólo lo que se haga colgar del objeto "exports" será
    accesible desde fuera del módulo, sin perjuicio de que esas
    funciones tengan visibilidad de otras funciones que, aún no
    siendo exportadas, estén definidas dentro del propio módulo.

*/

/*

    Para usar en otro módulo (el "módulo cliente") una función
    exportada desde otro módulo (el "módulo servidor") hay que
    usar la palabra clave "require" y enrutar al módulo servidor.

    En el ejemplo, hemos creado en la carpeta "lib" dos módulos
    con objetos exportables, "constantes.js" y "landsat8.js".
    Supongamos que creamos en nuestro repositorio en GEE una
    carpeta "lib" para mantener esta misma estructura. En ese
    caso, para importar el módulo "landsat8.js" en otro script,
    haríamos lo siguiente:

*/
var landsat8 = require('users/tu_usuario/nombre_repositorio:lib/landsat8');

/*

    En ese momento, las funciones exportadas por "landsat8.js"
    estarían disponibles bajo el objeto "landsat8" en el código
    cliente:

*/
var capa_ndvi = landsat8.ndvi(una_imagen);

/*

    Por ejemplo, importemos las constantes. Habrá que ajustar la
    ruta a nuestro caso particular:

*/
var constantes = require('users/tu_usuario/nombre_repositorio:lib/constantes');

print(constantes.EXTENSION_DONYANA)

/*

    Incorporamos por tanto los dos módulos exportables a una
    carpeta "lib" en nuestro repositorio GEE para el resto de los
    experimentos.

*/

/*

    Ni que decir tiene que un módulo puede importar funciones de
    otro módulo que a su vez importa funciones de otros 3 que a
    su vez importan de otros 4... ¡pero cuidado! Una buena
    arquitectura de proyecto y módulos debe intentar evitar,
    dentro de lo posible, las dependencias excesivas e
    interminables. Es bien conocido en ingeniería de software un
    efecto llamado "Spaguetti Dependency" o "Dependency Hell"
    cuando esto se va de madre.

    Además, hay un efecto muy pernicioso, muy difícil de detectar
    y arreglar, que es el efecto de las referecias circulares: se
    produce cuando el módulo A depende de B pero B a su vez
    también depende de A, o lo hacen con una triple relación con
    terceros: A -> B -> C -> D -> A. Esto es un incordio tremendo
    y, por lo general, denota un pobre diseño de arquitectura por
    parte del arquitecto de software.

    Y nos pasa casi a diario :(

    Así que, como regla general: MANTENED LAS DEPENDENCIAS a las
    mínimas imprescindibles. Recordad el mantra de UNIX / Linux:
    una sóla cosa, hecha mejor que nadie.

*/