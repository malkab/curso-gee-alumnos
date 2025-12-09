// Las capas que vamos a necesitar para el NBR
var capas = ["SR_B7", "SR_B5"]

// Colección
var landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterDate('2017-01-01', '2018-01-01')
    .filterBounds(geometry)
    .select(capas)
    .filterMetadata("CLOUD_COVER", "less_than", 10);

/*

    Esta es la función map() que crea una capa "nueva" apoyándose
    en la estructura de datos de una ya existente y "reseteando"
    sus valores a 0 con una multiplicación, para luego sumarle 1.

*/
function capa_a_1(imagen) {
    var capa_uno = imagen.select("SR_B5")
        .multiply(0)
        .add(1)
        .rename("capa_uno");

    return imagen.addBands(capa_uno);
}

var landsat_con_capa_uno = landsat.map(capa_a_1);

print(landsat_con_capa_uno.first());

var visualizacion = {
    bands: ["capa_uno"],
    min: 0,
    max: 1
}

Map.addLayer(landsat_con_capa_uno.first(),
    visualizacion,
    "Landsat con capa uno"
);


/*

    Función map() para el cálculo del NBR.

*/
function nbr(imagen) {
    var nbr = imagen.normalizedDifference(['SR_B5', 'SR_B7'])
                .rename("NBR");

    return imagen.addBands(nbr);
}

var landsat_con_nbr = landsat.map(nbr);

print(landsat_con_nbr.first());

// Visualización de verde a rojo
var visualizacion_nbr = {
    bands: ["NBR"],
    min: 0,
    max: 0.4,
    palette: ["green", "red"]
}

Map.addLayer(landsat_con_nbr.first(),
    visualizacion_nbr,
    "Landsat con NBR"
);
