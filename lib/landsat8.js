/*

  Calcula el NDVI sobre una colección de imágenes Landsat 8. Para
  usar con map().

*/
exports.ndvi = function(image) {
    var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4'])
        .rename('NDVI');

    return image.addBands(ndvi, null, true);
}


/*

    Calcula la reflectancia real de las bandas para una colección
    de imágenes Landat 8. Para usar con map().

*/
exports.reflectancia = function(image) {
    // Reescalado de bandas ópticas.
    var bandas_opticas = image.select('SR_B.')
        .multiply(0.0000275)
        .add(-0.2);

    // Reescalado de bandas térmicas.
    var bandas_termicas = image.select('ST_B.*')
        .multiply(0.00341802)
        .add(149.0);

    return image
        .addBands(bandas_opticas, null, true)
        .addBands(bandas_termicas, null, true);
}


/*

    Esta es una función que no se exporta pero que podría darle
    servicio a alguna de las funciones que sí se exportan. Las
    funciones exportadas de arriba podrían utilizarla sin
    problema puesto que forman parte de su propio módulo y por
    tanto "se ven".

*/
function ejemploFuncionPrivada() {
    // Código de la función.
}
