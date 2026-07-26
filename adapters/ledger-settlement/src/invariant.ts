type PostingLike = {
  amount_minor: number;
  direction: "debit" | "credit";
};

type TransactionLike = {
  postings: PostingLike[];
};

export const sumDebits = (transaction: TransactionLike): number =>
  transaction.postings
    .filter((posting) => posting.direction === "debit")
    .reduce((sum, posting) => sum + posting.amount_minor, 0);

export const sumCredits = (transaction: TransactionLike): number =>
  transaction.postings
    .filter((posting) => posting.direction === "credit")
    .reduce((sum, posting) => sum + posting.amount_minor, 0);

export const hasDoubleEntryBalance = (transaction: TransactionLike): boolean =>
  sumDebits(transaction) === sumCredits(transaction);
