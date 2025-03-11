const Product = require('../models/Product');
// repositories/productRepository.js
const { calculateDiscountedPrice } = require('../helpers/priceHelper');

exports.processOrderProducts = async (products) => {
  let total = 0;

  const orderProducts = await Promise.all(
    products.map(async (item) => {
      const product = await Product.findById(item.product);
      const finalPrice = calculateDiscountedPrice(product.grossPrice, product.discount);
      total += finalPrice * item.quantity;

      return {
        product: product._id,
        quantity: item.quantity,
        discount: product.discount,
        finalPrice,
      };
    })
  );

  // Filtrar nulls (productos no encontrados) si es que llega a haber
  const validOrderProducts = orderProducts.filter(item => item !== undefined);

  // Retornar el array de productos válidos y el total calculado
  return { validOrderProducts, total };
};

