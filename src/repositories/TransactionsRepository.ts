import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    // TODO
    const transactions = await this.find();

    const reduceBalance = (stack: Balance, actual: Transaction) => {
      switch (actual.type) {
        case 'income': {
          return {
            ...stack,
            income: stack.income + actual.value,
            total: stack.total + actual.value,
          };
        }
        case 'outcome': {
          return {
            ...stack,
            outcome: stack.outcome + actual.value,
            total: stack.total - actual.value,
          };
        }
        default: {
          return stack;
        }
      }
    };

    const balance = transactions.reduce(reduceBalance, {
      income: 0,
      outcome: 0,
      total: 0,
    });

    return balance;
  }
}

export default TransactionsRepository;
