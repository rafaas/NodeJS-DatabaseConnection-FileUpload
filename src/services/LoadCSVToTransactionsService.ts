import csvParse from 'csv-parse';
import fs from 'fs';

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface CategoryDTO {
  title: string;
}

interface ImportDTO {
  transactions: TransactionDTO[];
  categories: CategoryDTO[];
}

class LoadCSVToTransactionsService {
  async execute(csvFilePath: string): Promise<ImportDTO> {
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions = [] as TransactionDTO[];
    const categories = [] as CategoryDTO[];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      transactions.push({
        title,
        type,
        value,
        category,
      });

      categories.push({
        title: category,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    await fs.promises.unlink(csvFilePath);

    return { transactions, categories };
  }
}

export default LoadCSVToTransactionsService;
