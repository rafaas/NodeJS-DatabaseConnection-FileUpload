import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_title: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category_title,
  }: Request): Promise<Transaction> {
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Invalid transaction type', 400);
    }

    const customRepository = getCustomRepository(TransactionsRepository);

    const { total } = await customRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError("You don't have enough balance", 400);
    }

    const categoriesRepository = getRepository(Category);
    let category = await categoriesRepository.findOne({
      where: { title: category_title },
    });

    if (!category) {
      category = categoriesRepository.create({
        title: category_title,
      });

      await categoriesRepository.save(category);
    }

    const transactionsRepository = getRepository(Transaction);

    const transaction = transactionsRepository.create({
      category,
      title,
      value,
      type,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
