import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  BridgedWithdrawals,
  Deposit,
  Withdrawal,
} from './types/ChildWithdrawalBatcher/ChildWithdrawalBatcher';
import { BatchedWithdrawal, RecipientBalance } from './types/schema';
import { bigZero } from './utils/constants';
import { recordBatch } from './utils/global-utils';

function loadRecipientBalance(recipient: Address): RecipientBalance {
  let recipientBalance = RecipientBalance.load(recipient.toHexString());
  if (recipientBalance == null) {
    recipientBalance = new RecipientBalance(recipient.toHexString());
    recipientBalance.currentBalance = bigZero;
  }
  return recipientBalance as RecipientBalance;
}

export function handleDeposit(event: Deposit): void {
  let recipientBalance = loadRecipientBalance(event.params.recipient);
  recipientBalance.currentBalance = recipientBalance.currentBalance.plus(
    event.params.amount,
  );
  recipientBalance.save();
}

export function handleWithdrawal(event: Withdrawal): void {
  let recipientBalance = loadRecipientBalance(event.params.balanceOwner);
  recipientBalance.currentBalance = recipientBalance.currentBalance.minus(
    event.params.amount,
  );
  recipientBalance.save();
}

export function handleBridgedWithdrawals(event: BridgedWithdrawals): void {
  let batchedWithdrawal = new BatchedWithdrawal(
    event.transaction.hash.toHexString(),
  );

  let numberOfWithdrawals = event.params.encodedDeposits.length;

  batchedWithdrawal.bridger = event.params.bridger;
  batchedWithdrawal.amount = event.params.amount;
  batchedWithdrawal.withdrawals = numberOfWithdrawals;
  batchedWithdrawal.timestamp = event.block.timestamp;
  batchedWithdrawal.save();

  // Update global values
  recordBatch(event.params.amount, BigInt.fromI32(numberOfWithdrawals));

  // Now update balances of all included recipients
  for (let i = 0; i < numberOfWithdrawals; i += 1) {
    // We want a 32 byte slice of the array.
    let encodedDeposit: Bytes = event.params.encodedDeposits[i];

    // First 20 bytes encode the recipient's address
    let recipient = encodedDeposit.subarray(0, 20) as Address;
    // remaining bytes encode the amount
    let amount = BigInt.fromUnsignedBytes(
      encodedDeposit.subarray(21).reverse() as Bytes,
    );

    let recipientBalance = loadRecipientBalance(recipient);
    recipientBalance.currentBalance = recipientBalance.currentBalance.minus(
      amount,
    );
    recipientBalance.save();
  }
}
