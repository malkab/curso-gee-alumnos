/*

  Calcula el NDVI sobre una colección de imágenes Landsat 8. Para
  usar con map().

*/
exports.ndvi = function(image) {
    var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4'])
        .toDouble()
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

    Aplica la máscara de calidad QA_PIXEL a una imagen.

*/
exports.mascara_qa_pixel = function(imagen) {
    // Seleccionamos la banda QA_PIXEL
    var qa = imagen.select('QA_PIXEL');

    // Creamos máscaras binarias para los flags de calidad que
    // nos interesa detectar.
    var dilatedCloud = 1 << 1;
    var cirrus       = 1 << 2;
    var cloud        = 1 << 3;
    var cloudShadow  = 1 << 4;
    var snow         = 1 << 5;
    var fill         = 1 << 0;

    // Vemos qué píxeles no tienen activados ninguno de los flags
    // anteriores.
    var mask = qa.bitwiseAnd(fill).eq(0)
        .and(qa.bitwiseAnd(dilatedCloud).eq(0))
        .and(qa.bitwiseAnd(cirrus).eq(0))
        .and(qa.bitwiseAnd(cloud).eq(0))
        .and(qa.bitwiseAnd(cloudShadow).eq(0))
        .and(qa.bitwiseAnd(snow).eq(0));

    // Enmascaramos la imagen con los píxeles que han pasado el
    // control de calidad.
    return imagen.updateMask(mask);
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
