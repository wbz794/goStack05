/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import path from 'path';
import fs from 'fs';
import csv from 'csv-parse';
import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  filename: string;
}

interface TransactionArray {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    const transactionsToSend: Transaction[] = [];
    const transactions: TransactionArray[] = [];
    const filePath = path.join(uploadConfig.directory, filename);
    let index = 0;
    const end = new Promise((resolve, _) =>
      fs
        .createReadStream(filePath)
        .pipe(csv())
        .on('data', row => {
          if (index > 0) {
            transactions.push({
              title: row[0].trim(),
              type: row[1].trim(),
              value: row[2].trim(),
              category: row[3].trim(),
            });
          }
          index += 1;
        })
        .on('end', async () => {
          for (const transaction of transactions) {
            let categoryDB = await categoriesRepository.findOne({
              where: { title: transaction.category },
            });
            if (!categoryDB) {
              categoryDB = categoriesRepository.create({
                title: transaction.category,
              });
              await categoriesRepository.save(categoryDB);
            }
            const { title, value, type } = transaction;

            transactionsToSend.push(
              transactionsRepository.create({
                title,
                value,
                type,
                category: categoryDB,
              }),
            );
          }
          await transactionsRepository.save(transactionsToSend);
          console.log(transactionsToSend);
          resolve(transactionsToSend);
        }),
    );
    return end.then(async data => data as Transaction[]);
  }
}

export default ImportTransactionsService;
