import hre from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Please set CONTRACT_ADDRESS environment variable before running the script.");
  }

  const election = await hre.ethers.getContractAt("Election", contractAddress);
  const filter = election.filters.VoteCast();
  const events = await election.queryFilter(filter, 0, "latest");

  if (events.length === 0) {
    console.log("No vote history found.");
    return;
  }

  console.log(`Found ${events.length} vote event(s):`);
  for (const event of events) {
    const block = await hre.ethers.provider.getBlock(event.blockNumber);
    console.log({
      txHash: event.transactionHash,
      voter: event.args.voter,
      candidateId: event.args.candidateId.toString(),
      timestamp: event.args.timestamp.toString(),
      blockNumber: event.blockNumber,
      datetime: new Date(block.timestamp * 1000).toISOString(),
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
