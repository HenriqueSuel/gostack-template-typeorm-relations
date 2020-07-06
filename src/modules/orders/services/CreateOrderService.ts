import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IUpdate {
  id: string;
  quantity: number;
}
@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const checkCustomerExists = await this.customersRepository.findById(
      customer_id,
    );

    if (!checkCustomerExists) {
      throw new AppError('henrique');
    }

    const listProduct = await this.productsRepository.findAllById(products);

    if (listProduct.length !== products.length) {
      throw new AppError('henrique');
    }

    const updateProducts: IUpdate[] = [];
    const listProducts = listProduct.map(product => {
      const productSelected = products.find(
        findProduct =>
          findProduct.id === product.id &&
          findProduct.quantity <= product.quantity,
      );
      if (!productSelected) {
        throw new AppError('henrique', 400);
      }
      updateProducts.push({
        id: product.id,
        quantity: product.quantity - productSelected.quantity,
      });
      return {
        product_id: product.id,
        price: product.price,
        quantity: productSelected.quantity,
      };
    });

    await this.productsRepository.updateQuantity(updateProducts);

    const data = {
      customer: { ...checkCustomerExists },
      products: listProducts,
    };

    const customers = await this.ordersRepository.create({ ...data });

    return customers;
  }
}

export default CreateOrderService;
