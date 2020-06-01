import path from 'path';
import { getRepository, getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import LoadCSVToTransactionsService from './LoadCSVToTransactionsService';
import uploadConfig from '../config/upload';

class ImportTransactionsService {
  async execute(csvFilename: string): Promise<Transaction[]> {
    const loadCsvService = new LoadCSVToTransactionsService();
    const csvFilePath = path.resolve(
      __dirname,
      uploadConfig.directory,
      csvFilename,
    );
    const { categories, transactions } = await loadCsvService.execute(
      csvFilePath,
    );

    const insertCategories = categories.map(categoryDTO => categoryDTO.title);

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(insertCategories),
      },
    });

    const existeCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = insertCategories
      .filter(category => !existeCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createTransactions = transactionsRepository.create(
      transactions.map(transactionDTO => ({
        title: transactionDTO.title,
        type: transactionDTO.type,
        value: transactionDTO.value,
        category: finalCategories.find(
          category => category.title === transactionDTO.category,
        ),
      })),
    );

    await transactionsRepository.save(createTransactions);

    return createTransactions;
  }
}

export default ImportTransactionsService;
