import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const checkCategoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    const balance = (await transactionsRepository.getBalance()).total;

    if (type === 'outcome' && balance < value) {
      throw new AppError('Insuficient balance.');
    }

    const newCategory = categoriesRepository.create({ title: category });
    if (!checkCategoryExists) {
      await categoriesRepository.save(newCategory);
    }

    const { id: category_id } = checkCategoryExists || newCategory;
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });
    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
