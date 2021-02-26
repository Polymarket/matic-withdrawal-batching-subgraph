# Matic Withdrawal Batching Subgraph

This subgraph is tracks a deployment of the [Matic Bridge Batcher](https://github.com/TokenUnion/matic-bridge-batcher) contracts in order to help decide when a batch of withdrawals is ready to be processed and then facilitate this processing.

## Usage

Batch processors can perform the following query to get the users currently with the largest balances on the ChildWithdrawalBatcher contract

```graphql
query largestUserBalances($minBalance: Int!, $maxBatchSize: Int!) {
    recipientBalances(where: { currentBalance_gt: $minBalance }, first: $maxBatchSize, orderBy: currentBalance, orderDirection: desc) {
      id
      currentBalance    
    }
}
```

This response can then easily be encoded into the input to pass to `bridgeWithdrawals`. The subgraph will then keep track of this batch so that it can be easily found to be included in a proof to be submitted on Ethereum.

```graphql
query recentBatches() {
    BatchedWithdrawal(orderBy: timestamp, orderDirection: desc) {
      id
      amount    
    }
}
```

It's recommended to use the library [@tomfrench/matic-proofs](https://github.com/TomAFrench/matic-proofs) for submitting these proofs.
