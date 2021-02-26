import { BigInt } from '@graphprotocol/graph-ts';
import { Global } from '../types/schema';
import { bigZero } from './constants';

export function requireGlobal(): Global {
  let global = Global.load('');
  if (global == null) {
    global = new Global('');
    global.totalVolume = bigZero;
    global.batches = 0;
    global.withdrawals = 0;
  }
  return global as Global;
}

export function recordBatch(amount: BigInt, withdrawals: BigInt): void {
  let global = requireGlobal();
  global.totalVolume = global.totalVolume.plus(amount);
  global.batches += 1;
  global.withdrawals += withdrawals.toI32();
  global.save();
}
