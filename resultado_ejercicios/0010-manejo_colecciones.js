/*

    Solucíon ejercicio 0010: Manejo de colecciones.

*/

// Nótese que la estructura de datos de Sentinel-2 es diferente a
// la de Landsat 8, por lo que los nombres de las bandas y las
// propiedades (metadatos) también lo son.

// Sin embargo, obviamente, los métodos para manejar las
// colecciones son los mismos, ya que internamente, las
// colecciones, a pesar de tener diferencias en su estructura de
// datos, se comportan igual.

// Creamos la colección de imágenes de Sentinel-2:
var coleccion = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterDate('2018-01-01', '2019-01-01')
    .filterBounds(geometry)
    .select(['B4','B3','B2'])
    .filterMetadata("CLOUDY_PIXEL_PERCENTAGE", "less_than", 20);

print(coleccion);