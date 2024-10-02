import * as dotenv from "dotenv";
import {
  Args,
  ArrayTypes,
  CHAIN_ID,
  bytesToStr,
  bytesToU64,
  WalletClient,
  ClientFactory,
  DefaultProviderUrls,
  MAX_GAS_CALL,
  fromMAS,
} from "@massalabs/massa-web3";
import { getEnvVariable } from "./utils";
import { SellOffer } from "./SellOffer";
import { HistorySales } from "./HistorySales";
import { MakeOffer } from "./MakeOffer";
import { Auction } from "./Auction";
import { Bid } from "./Bid";
import { SellFractionOffer } from "./SellFractionOffer";

// Load .env file content into process.env
dotenv.config();

// Get environment variables
const privateKey = getEnvVariable("SECRET_KEY");
const accountAddress = getEnvVariable("ACCOUNT_ADDRESS");
const contractAddress = getEnvVariable("CONTRACT_ADDRESS");
const secondPrivateKey = getEnvVariable("SECOND_SECRET_KEY");
const secondAccountAddress = getEnvVariable("SECOND_ACCOUNT_ADDRESS");
const getMarketplaceOwnerPrivateKey = getEnvVariable("MARKETPLACE_OWNER_KEY");
const getMarketplaceOwner = getEnvVariable("MARKETPLACE_OWNER");

// Validate environment variables
if (!privateKey) {
  throw new Error(`Missing SECRET_KEY in .env file`);
}
if (!accountAddress) {
  throw new Error(`Missing ACCOUNT_ADDRESS in .env file`);
}
if (!contractAddress) {
  throw new Error(`Missing CONTRACT_ADDRESS in .env file`);
}
if (!secondPrivateKey) {
  throw new Error(`Missing SECOND_SECRET_KEY in .env file`);
}
if (!secondAccountAddress) {
  throw new Error(`Missing SECOND_ACCOUNT_ADDRESS in .env file`);
}

let adminClient: any;
let testnetClient: any;
let testnetClient2: any;

// Initialize clients
async function initClient() {
  const baseAccount = await WalletClient.getAccountFromSecretKey(privateKey);
  const baseAccount2 = await WalletClient.getAccountFromSecretKey(
    secondPrivateKey
  );
  const adminAccount = await WalletClient.getAccountFromSecretKey(
    getMarketplaceOwnerPrivateKey
  );
  const chainId = CHAIN_ID.BuildNet;

  adminClient = await ClientFactory.createDefaultClient(
    DefaultProviderUrls.BUILDNET,
    chainId,
    true, // retry failed requests
    adminAccount // optional parameter
  );

  testnetClient = await ClientFactory.createDefaultClient(
    DefaultProviderUrls.BUILDNET,
    chainId,
    true, // retry failed requests
    baseAccount // optional parameter
  );

  testnetClient2 = await ClientFactory.createDefaultClient(
    DefaultProviderUrls.BUILDNET,
    chainId,
    true, // retry failed requests
    baseAccount2 // optional parameter
  );
}

// Read smart contract information
async function readSmartContractInfo() {
  try {
    console.log("----------Contract Info----------");
    const owner = await testnetClient.smartContracts().readSmartContract({
      maxGas: BigInt(MAX_GAS_CALL),
      targetAddress: contractAddress,
      targetFunction: "getMarketplaceOwner",
      parameter: new Args(),
    });
    console.log("Marketplace Owner: ", bytesToStr(owner.returnValue));

    const fee = await testnetClient.smartContracts().readSmartContract({
      maxGas: BigInt(MAX_GAS_CALL),
      targetAddress: contractAddress,
      targetFunction: "getMarketplaceFee",
      parameter: new Args(),
    });
    console.log("Marketplace Fee: ", bytesToU64(fee.returnValue));

    const evolvableCollections = await testnetClient
      .smartContracts()
      .readSmartContract({
        maxGas: BigInt(MAX_GAS_CALL),
        targetAddress: contractAddress,
        targetFunction: "getEvolvableNftList",
        parameter: new Args(),
      });
    console.log(
      "Marketplace Evolvable Collections: ",
      new Args(evolvableCollections.returnValue).nextArray(ArrayTypes.STRING)
    );

    const regularCollections = await testnetClient
      .smartContracts()
      .readSmartContract({
        maxGas: BigInt(MAX_GAS_CALL),
        targetAddress: contractAddress,
        targetFunction: "getRegularNftList",
        parameter: new Args(),
      });
    console.log(
      "Marketplace Regular Collections: ",
      new Args(regularCollections.returnValue).nextArray(ArrayTypes.STRING)
    );

    const fractionalCollections = await testnetClient
      .smartContracts()
      .readSmartContract({
        maxGas: BigInt(MAX_GAS_CALL),
        targetAddress: contractAddress,
        targetFunction: "getFractionalNftList",
        parameter: new Args(),
      });
    console.log(
      "Marketplace Fractional Collections: ",
      new Args(fractionalCollections.returnValue).nextArray(ArrayTypes.STRING)
    );

    const historySales = await testnetClient
      .smartContracts()
      .readSmartContract({
        maxGas: BigInt(MAX_GAS_CALL),
        targetAddress: contractAddress,
        targetFunction: "getHistorySales",
        parameter: new Args(),
      });
    console.log(
      "History Sales: ",
      new Args(
        historySales.returnValue
      ).nextSerializableObjectArray<HistorySales>(HistorySales)
    );
    console.log("---------------------------------");
  } catch (error) {
    console.error("Error reading smart contract info:", error);
  }
}

/************ADMIN FEATURES************/

async function claim(amount: number, address: string) {
  try {
    let amountBigint = BigInt(amount);
    let claimArgs = new Args().addU64(amountBigint).addString(address);
    let tx_id = await adminClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "claim",
      parameter: claimArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In claiming function:", error);
  }
}

async function setMarketplaceFee(fee: number) {
  try {
    let newFee = BigInt(fee);
    let feeArg = new Args().addU64(newFee);
    let tx_id = await adminClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "setMarketplaceFee",
      parameter: feeArg.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In setting the marketplace fee:", error);
  }
}

async function setNewRegularNftBytecode(newCollectionAddress: string) {
  try {
    let bytecodeArgs = new Args().addString(newCollectionAddress);
    let tx_id = await adminClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "setNewRegularNftBytecode",
      parameter: bytecodeArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In setNewRegularNftBytecode function:", error);
  }
}

async function setNewEvolvableNftBytecode(newCollectionAddress: string) {
  try {
    let bytecodeArgs = new Args().addString(newCollectionAddress);
    let tx_id = await adminClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "setNewEvolvableNftBytecode",
      parameter: bytecodeArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In setNewEvolvableNftBytecode function:", error);
  }
}

async function setNewFractionalNftBytecode(newCollectionAddress: string) {
  try {
    let bytecodeArgs = new Args().addString(newCollectionAddress);
    let tx_id = await adminClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "setNewFractionalNftBytecode",
      parameter: bytecodeArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In setNewFractionalNftBytecode function:", error);
  }
}

async function delEvolvableCollection(
  ownerAddress: string,
  collectionAddress: string
) {
  try {
    let deleteArgs = new Args()
      .addString(ownerAddress)
      .addString(collectionAddress);
    let tx_id = await adminClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "delEvolvableCollection",
      parameter: deleteArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In deleting collection:", error);
  }
}

async function delRegularCollection(
  ownerAddress: string,
  collectionAddress: string
) {
  try {
    let deleteArgs = new Args()
      .addString(ownerAddress)
      .addString(collectionAddress);
    let tx_id = await adminClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "delRegularCollection",
      parameter: deleteArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In deleting collection:", error);
  }
}

async function delFractionalCollection(
  ownerAddress: string,
  collectionAddress: string
) {
  try {
    let deleteArgs = new Args()
      .addString(ownerAddress)
      .addString(collectionAddress);
    let tx_id = await adminClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "delFractionalCollection",
      parameter: deleteArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In deleting collection:", error);
  }
}

/************USER FEATURES************/

async function create_evolvable_collection(
  collection_name: string,
  collection_symbol: string,
  collection_description: string,
  collection_image: string,
  collection_baseUri: string,
  collection_max_up: number,
  collection_mint_price: number,
  collection_royalty_fee: number,
  collection_upgrade_count_time: number,
  collection_max_upgrade: number
) {
  try {
    let createArgs = new Args()
      .addString(collection_name)
      .addString(collection_symbol)
      .addString(collection_description)
      .addString(collection_image)
      .addString(collection_baseUri)
      .addU64(BigInt(collection_max_up))
      .addU64(BigInt(collection_mint_price))
      .addU64(BigInt(collection_royalty_fee))
      .addU64(BigInt(collection_upgrade_count_time))
      .addU64(BigInt(collection_max_upgrade));
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "create_evolvable_collection",
      parameter: createArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(7),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In create collection:", error);
  }
}

async function create_regular_collection(
  collection_name: string,
  collection_symbol: string,
  collection_description: string,
  collection_image: string,
  collection_baseUri: string,
  collection_max_up: number,
  collection_mint_price: number,
  collection_royalty_fee: number
) {
  try {
    let createArgs = new Args()
      .addString(collection_name)
      .addString(collection_symbol)
      .addString(collection_description)
      .addString(collection_image)
      .addString(collection_baseUri)
      .addU64(BigInt(collection_max_up))
      .addU64(BigInt(collection_mint_price))
      .addU64(BigInt(collection_royalty_fee));
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "create_regular_collection",
      parameter: createArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(7),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In create collection:", error);
  }
}

async function create_fractional_collection(
  collection_name: string,
  collection_symbol: string,
  collection_description: string,
  collection_image: string,
  collection_baseUri: string,
  collection_max_up: number,
  collection_mint_price: number,
  collection_royalty_fee: number
) {
  try {
    let createArgs = new Args()
      .addString(collection_name)
      .addString(collection_symbol)
      .addString(collection_description)
      .addString(collection_image)
      .addString(collection_baseUri)
      .addU64(BigInt(collection_max_up))
      .addU64(BigInt(collection_mint_price))
      .addU64(BigInt(collection_royalty_fee));
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "create_fractional_collection",
      parameter: createArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(7),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In create collection:", error);
  }
}

async function register_evolvable_nft(collectionAddress: string) {
  try {
    let createArgs = new Args().addString(collectionAddress);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "register_evolvable_nft",
      parameter: createArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(4),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In register collection:", error);
  }
}

async function register_regular_nft(collectionAddress: string) {
  try {
    let createArgs = new Args().addString(collectionAddress);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "register_regular_nft",
      parameter: createArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(4),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In register collection:", error);
  }
}

async function register_fractional_nft(collectionAddress: string) {
  try {
    let createArgs = new Args().addString(collectionAddress);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "register_fractional_nft",
      parameter: createArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(4),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In register collection:", error);
  }
}

async function getSpecificEvolvableNftList(address: string) {
  const list = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: contractAddress,
    targetFunction: "getSpecificEvolvableNftList",
    parameter: new Args().addString(address).serialize(),
  });
  console.log(
    `${address} evolvable collection list: `,
    new Args(list.returnValue).nextArray(ArrayTypes.STRING)
  );
}

async function getSpecificRegularNftList(address: string) {
  const list = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: contractAddress,
    targetFunction: "getSpecificRegularNftList",
    parameter: new Args().addString(address).serialize(),
  });
  console.log(
    `${address} regular collection list: `,
    new Args(list.returnValue).nextArray(ArrayTypes.STRING)
  );
}

async function getSpecificFractionalNftList(address: string) {
  const list = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: contractAddress,
    targetFunction: "getSpecificFractionalNftList",
    parameter: new Args().addString(address).serialize(),
  });
  console.log(
    `${address} fractional collection list: `,
    new Args(list.returnValue).nextArray(ArrayTypes.STRING)
  );
}

async function getOwnerOf(collection_address: string, tokenId: number) {
  const owner = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: collection_address,
    targetFunction: "ownerOf",
    parameter: new Args().addU256(BigInt(tokenId)).serialize(),
  });
  console.log(`the owner is: `, bytesToStr(owner.returnValue));
}

async function getFractions(collection_address: string, tokenId: number) {
  const fractions = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: collection_address,
    targetFunction: "getFractions",
    parameter: new Args().addU256(BigInt(tokenId)).serialize(),
  });
  console.log(
    `the fractions of ${collection_address}/${tokenId}: `,
    bytesToU64(fractions.returnValue)
  );
}

async function getFractionOwnership(
  collection_address: string,
  tokenId: number,
  owner: string
) {
  const fractions = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: collection_address,
    targetFunction: "getFractionOwnership",
    parameter: new Args().addU256(BigInt(tokenId)).addString(owner).serialize(),
  });
  console.log(`fractions for ${owner}: `, bytesToU64(fractions.returnValue));
}

async function getFractionApproved(
  collection_address: string,
  tokenId: number,
  owner: string
) {
  const fractions = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: collection_address,
    targetFunction: "getFractionApproved",
    parameter: new Args().addU256(BigInt(tokenId)).addString(owner).serialize(),
  });
  console.log(`approved to:  `, bytesToStr(fractions.returnValue));
}

async function getSellOffer(collection_address: string, tokenId: number) {
  const sellOffers = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: contractAddress,
    targetFunction: "getSellOffer",
    parameter: new Args()
      .addString(collection_address)
      .addU256(BigInt(tokenId)),
  });
  console.log(
    "Sell offers: ",
    new Args(sellOffers.returnValue).nextSerializable<SellOffer>(SellOffer)
  );
}

async function getNftOffer(collection_address: string, tokenId: number) {
  const nftOffers = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: contractAddress,
    targetFunction: "getNftOffer",
    parameter: new Args()
      .addString(collection_address)
      .addU256(BigInt(tokenId)),
  });
  console.log(
    "NFT offers: ",
    new Args(nftOffers.returnValue).nextSerializable<MakeOffer>(MakeOffer)
  );
}

async function getAuction(collection_address: string, tokenId: number) {
  const auctions = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: contractAddress,
    targetFunction: "getAuction",
    parameter: new Args()
      .addString(collection_address)
      .addU256(BigInt(tokenId)),
  });
  console.log(
    "Auction offer: ",
    new Args(auctions.returnValue).nextSerializable<Auction>(Auction)
  );
}

async function getBid(collection_address: string, tokenId: number) {
  const auctions = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: contractAddress,
    targetFunction: "getBid",
    parameter: new Args()
      .addString(collection_address)
      .addU256(BigInt(tokenId)),
  });
  console.log(
    "Bid offer: ",
    new Args(auctions.returnValue).nextSerializable<Bid>(Bid)
  );
}

async function getFracSellOffer(
  seller: string,
  collection_address: string,
  tokenId: number
) {
  const fraction = await testnetClient.smartContracts().readSmartContract({
    maxGas: BigInt(MAX_GAS_CALL),
    targetAddress: contractAddress,
    targetFunction: "getFracSellOffer",
    parameter: new Args()
      .addString(seller)
      .addString(collection_address)
      .addU256(BigInt(tokenId)),
  });
  console.log(
    "Fraction offer: ",
    new Args(fraction.returnValue).nextSerializable<SellFractionOffer>(
      SellFractionOffer
    )
  );
}

async function mint(to: string) {
  try {
    let mintArgs = new Args().addString(to);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: "AS1kZ5hwEEGmmTBG4ikJmnrsjQAvu7ozXXv5jejNonMUwEBcWxD9",
      targetFunction: "mint",
      parameter: mintArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In mint NFT:", error);
  }
}

async function approve(to: string, tokenId: number) {
  try {
    let approveArgs = new Args().addString(to).addU256(BigInt(tokenId));
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: "AS1CPYmBs92V4W234kmZHGyYHsjZwj5SdhxA7stBFEXZatRyEZkT",
      targetFunction: "approve",
      parameter: approveArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In approve NFT:", error);
  }
}

async function sell_offer(
  seller: string,
  collection_address: string,
  tokenId: number,
  price: number,
  expirationTime: number
) {
  try {
    let offer: SellOffer = new SellOffer(
      seller,
      collection_address,
      BigInt(tokenId),
      BigInt(price),
      BigInt(expirationTime)
    );

    let offerArgs = new Args().addSerializable<SellOffer>(offer);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "sell_offer",
      parameter: offerArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In making sell offer:", error);
  }
}

async function remove_sell_offer(
  seller: string,
  collection_address: string,
  tokenId: number,
  price: number,
  expirationTime: number
) {
  try {
    let offer: SellOffer = new SellOffer(
      seller,
      collection_address,
      BigInt(tokenId),
      BigInt(price),
      BigInt(expirationTime)
    );

    let offerArgs = new Args().addSerializable<SellOffer>(offer);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "remove_sell_offer",
      parameter: offerArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In removing sell offer:", error);
  }
}

async function buy_nft(
  seller: string,
  collection_address: string,
  tokenId: number,
  price: number,
  expirationTime: number
) {
  try {
    let offer: SellOffer = new SellOffer(
      seller,
      collection_address,
      BigInt(tokenId),
      BigInt(price),
      BigInt(expirationTime)
    );

    let offerArgs = new Args().addSerializable<SellOffer>(offer);
    let tx_id = await testnetClient2.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "buy_nft",
      parameter: offerArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(price),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In buying NFT:", error);
  }
}

async function finalize_sell(
  seller: string,
  collection_address: string,
  tokenId: number,
  price: number,
  expirationTime: number
) {
  try {
    let offer: SellOffer = new SellOffer(
      seller,
      collection_address,
      BigInt(tokenId),
      BigInt(price),
      BigInt(expirationTime)
    );

    let offerArgs = new Args().addSerializable<SellOffer>(offer);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "finalize_sell",
      parameter: offerArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In finalize sell offer:", error);
  }
}

async function make_nft_offer(
  offerer: string,
  collection_address: string,
  tokenId: number,
  offerPrice: number,
  offerTime: number
) {
  try {
    let offer: MakeOffer = new MakeOffer(
      offerer,
      collection_address,
      BigInt(tokenId),
      BigInt(offerPrice),
      BigInt(offerTime)
    );

    let offerArgs = new Args().addSerializable<MakeOffer>(offer);
    let tx_id = await testnetClient2.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "make_nft_offer",
      parameter: offerArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(offerPrice),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In make NFT offer:", error);
  }
}

async function accept_nft_offer(
  offerer: string,
  collection_address: string,
  tokenId: number,
  offerPrice: number,
  offerTime: number
) {
  try {
    let offer: MakeOffer = new MakeOffer(
      offerer,
      collection_address,
      BigInt(tokenId),
      BigInt(offerPrice),
      BigInt(offerTime)
    );

    let offerArgs = new Args().addSerializable<MakeOffer>(offer);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "accept_nft_offer",
      parameter: offerArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In accept NFT offer:", error);
  }
}

async function list_nft_for_auction(
  seller: string,
  collection_address: string,
  tokenId: number,
  startPrice: number,
  minIncrement: number,
  expirationTime: number
) {
  try {
    let auction: Auction = new Auction(
      seller,
      collection_address,
      BigInt(tokenId),
      BigInt(startPrice),
      BigInt(minIncrement),
      BigInt(expirationTime)
    );

    let auctionArgs = new Args().addSerializable<Auction>(auction);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "list_nft_for_auction",
      parameter: auctionArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In list NFT for auction:", error);
  }
}

async function place_bid(
  bidder: string,
  collection_address: string,
  tokenId: number,
  bidAmount: number,
  bidTime: number
) {
  try {
    let bid: Bid = new Bid(
      bidder,
      collection_address,
      BigInt(tokenId),
      BigInt(bidAmount),
      BigInt(bidTime)
    );

    let auctionArgs = new Args().addSerializable<Bid>(bid);
    let tx_id = await testnetClient2.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "place_bid",
      parameter: auctionArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(bidAmount),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In place bid:", error);
  }
}

async function finalize_auction(
  seller: string,
  collection_address: string,
  tokenId: number,
  startPrice: number,
  minIncrement: number,
  expirationTime: number
) {
  try {
    let auction: Auction = new Auction(
      seller,
      collection_address,
      BigInt(tokenId),
      BigInt(startPrice),
      BigInt(minIncrement),
      BigInt(expirationTime)
    );

    let auctionArgs = new Args().addSerializable<Auction>(auction);
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "finalize_auction",
      parameter: auctionArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In finalize auction:", error);
  }
}

async function fractionalize(
  collection_address: string,
  tokenId: number,
  fractions: number
) {
  try {
    let fractionArgs = new Args()
      .addU256(BigInt(tokenId))
      .addU64(BigInt(fractions));
    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: collection_address,
      targetFunction: "fractionalize",
      parameter: fractionArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In fractionalize nft:", error);
  }
}

async function approveFraction(
  collection_address: string,
  tokenId: number,
  approved: string
) {
  let approveFractionArgs = new Args()
    .addU256(BigInt(tokenId))
    .addString(approved);
  let tx_id = await testnetClient.smartContracts().callSmartContract({
    targetAddress: collection_address,
    targetFunction: "approveFraction",
    parameter: approveFractionArgs.serialize(),
    maxGas: BigInt(MAX_GAS_CALL),
    coins: fromMAS(0),
    fee: fromMAS(0.01),
  });
  console.log(tx_id);
}

async function sell_fraction(
  seller: string,
  collection_address: string,
  tokenId: number,
  fractions: number,
  price: number,
  expirationTime: number
) {
  try {
    let fractionSell: SellFractionOffer = new SellFractionOffer(
      seller,
      collection_address,
      BigInt(tokenId),
      BigInt(fractions),
      BigInt(price),
      BigInt(expirationTime)
    );

    let fractionSellArgs = new Args().addSerializable<SellFractionOffer>(
      fractionSell
    );

    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "sell_fraction",
      parameter: fractionSellArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In sell fraction:", error);
  }
}

async function remove_sell_fraction(
  seller: string,
  collectionAddress: string,
  tokenId: number,
  fractions: number,
  price: number,
  expirationTime: number
) {
  try {
    let fractionSell: SellFractionOffer = new SellFractionOffer(
      seller,
      collectionAddress,
      BigInt(tokenId),
      BigInt(fractions),
      BigInt(price),
      BigInt(expirationTime)
    );

    let fractionSellArgs = new Args().addSerializable<SellFractionOffer>(
      fractionSell
    );

    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "remove_sell_fraction",
      parameter: fractionSellArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In remove sell fraction:", error);
  }
}

async function buy_fraction(
  seller: string,
  collectionAddress: string,
  tokenId: number,
  fractions: number,
  price: number,
  expirationTime: number
) {
  try {
    let fraction: SellFractionOffer = new SellFractionOffer(
      seller,
      collectionAddress,
      BigInt(tokenId),
      BigInt(fractions),
      BigInt(price),
      BigInt(expirationTime)
    );

    let fractionBuyArgs = new Args().addSerializable<SellFractionOffer>(
      fraction
    );

    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "buy_fraction",
      parameter: fractionBuyArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: BigInt(price),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In buy fraction:", error);
  }
}

async function finalize_fraction_sell(
  seller: string,
  collectionAddress: string,
  tokenId: number,
  fractions: number,
  price: number,
  expirationTime: number
) {
  try {
    let fraction: SellFractionOffer = new SellFractionOffer(
      seller,
      collectionAddress,
      BigInt(tokenId),
      BigInt(fractions),
      BigInt(price),
      BigInt(expirationTime)
    );

    let fractionSellArgs = new Args().addSerializable<SellFractionOffer>(
      fraction
    );

    let tx_id = await testnetClient.smartContracts().callSmartContract({
      targetAddress: contractAddress,
      targetFunction: "finalize_fraction_sell",
      parameter: fractionSellArgs.serialize(),
      maxGas: BigInt(MAX_GAS_CALL),
      coins: fromMAS(0),
      fee: fromMAS(0.01),
    });
    console.log(tx_id);
  } catch (error) {
    console.error("Error In remove sell fraction:", error);
  }
}

// Main function to initialize clients and read smart contract info
async function main() {
  try {
    await initClient();
    await readSmartContractInfo();
    // await setMarketplaceFee(30);

    // await setNewRegularNftBytecode(
    //   "AS1N9yy97zaa476cNz14swHBdwYYK272r5Cr1swVJ5JYoiYkYvek"
    // );

    // await setNewFractionalNftBytecode(
    //   "AS12J454HDzPKxM1s1y4Az3b4CfGT8web8jTEGXWgQAtVjwp8HzLJ"
    // );

    // await create_evolvable_collection(
    //   "Test Collection",
    //   "TC",
    //   "This is a test collection",
    //   "image1",
    //   "Test Uri/",
    //   1050,
    //   100000000,
    //   50,
    //   60000,
    //   5
    // );

    // await create_regular_collection(
    //   "Test Collection",
    //   "TC",
    //   "This is a test collection",
    //   "image1",
    //   "Test Uri/",
    //   1050,
    //   100000000,
    //   50
    // );

    // await create_fractional_collection(
    //   "Test Collection",
    //   "TC",
    //   "This is a test collection",
    //   "image1",
    //   "Test Uri/",
    //   1050,
    //   100000000,
    //   50
    // );

    // await register_evolvable_nft(
    //   "AS1E2MsUSQMXBGviFBDYpjPaX7bfbdR1Zq92tYceBqAaedznHyk1"
    // );
    // await register_regular_nft(
    //   "AS12sRX3yx5iPWhbkYH4wPPY1DawR1oZKFdT8V5ndFD2sNeosd6Q8"
    // );
    // await register_fractional_nft(
    //   "AS12nnbn2gJKchgfmtpnqFHySFFLYAob9KbJXQGuqsGgak6d5Gi2F"
    // );

    // await delRegularCollection(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS1RUSAEw6Um8mr9wrp1W6ZWZyo4VxPmq454GRcUWrpKYHstJXEx"
    // );

    // await mint("AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C");
    // await approve(contractAddress, 1);
    // await sell_offer(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS1CPYmBs92V4W234kmZHGyYHsjZwj5SdhxA7stBFEXZatRyEZkT",
    //   1,
    //   1000000000,
    //   1722452642000
    // );
    // await remove_sell_offer(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS1Q65Mrh7Qv8nYCAQhEArqKLncgGUthLNFAuDnURUfwKTdi119X",
    //   1,
    //   1000000000,
    //   1721753784000
    // );
    // await buy_nft(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS12n8b13njGwEdFB618nuJ8x45PfEGPjG5WuRJa1b4P4FRfji2cc",
    //   2,
    //   1000000000,
    //   1722429331000
    // );
    // await finalize_sell(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS1Q65Mrh7Qv8nYCAQhEArqKLncgGUthLNFAuDnURUfwKTdi119X",
    //   1,
    //   1000000000,
    //   1721753784000
    // );
    // await make_nft_offer(
    //   "AU1bFBb1FB96M39FEkuopMUiq8osH5tJAZumGs4xkXAo3bVYexFc",
    //   "AS12n8b13njGwEdFB618nuJ8x45PfEGPjG5WuRJa1b4P4FRfji2cc",
    //   1,
    //   4000000000,
    //   Date.now()
    // );
    // await accept_nft_offer(
    //   "AU1bFBb1FB96M39FEkuopMUiq8osH5tJAZumGs4xkXAo3bVYexFc",
    //   "AS12n8b13njGwEdFB618nuJ8x45PfEGPjG5WuRJa1b4P4FRfji2cc",
    //   1,
    //   5000000000,
    //   1722426013443
    // );
    // await list_nft_for_auction(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS12n8b13njGwEdFB618nuJ8x45PfEGPjG5WuRJa1b4P4FRfji2cc",
    //   4,
    //   10000000000,
    //   1000000000,
    //   1722430672000
    // );
    // await place_bid(
    //   "AU1bFBb1FB96M39FEkuopMUiq8osH5tJAZumGs4xkXAo3bVYexFc",
    //   "AS12n8b13njGwEdFB618nuJ8x45PfEGPjG5WuRJa1b4P4FRfji2cc",
    //   3,
    //   11000000000,
    //   Date.now()
    // );
    // await finalize_auction(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS12NP7YxSV5CwC1xt4JJfWuARS6yw5VUY6TzR1v2WHeWEaU2UFFp",
    //   1,
    //   100000000000,
    //   10000000000,
    //   1722004207000
    // );
    // await fractionalize(
    //   "AS1kZ5hwEEGmmTBG4ikJmnrsjQAvu7ozXXv5jejNonMUwEBcWxD9",
    //   1,
    //   100
    // );
    // await approveFraction(
    //   "AS1kZ5hwEEGmmTBG4ikJmnrsjQAvu7ozXXv5jejNonMUwEBcWxD9",
    //   1,
    //   contractAddress
    // );
    // await sell_fraction(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS1kZ5hwEEGmmTBG4ikJmnrsjQAvu7ozXXv5jejNonMUwEBcWxD9",
    //   1,
    //   50,
    //   1000000000,
    //   1722470144000
    // );
    // await remove_sell_fraction(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS1kZ5hwEEGmmTBG4ikJmnrsjQAvu7ozXXv5jejNonMUwEBcWxD9",
    //   1,
    //   50,
    //   1000000000,
    //   1722462808000
    // );
    // await buy_fraction(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS1kZ5hwEEGmmTBG4ikJmnrsjQAvu7ozXXv5jejNonMUwEBcWxD9",
    //   1,
    //   50,
    //   1000000000,
    //   1722470144000
    // );
    // await getSpecificEvolvableNftList(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C"
    // );
    // await getSpecificRegularNftList(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C"
    // );
    // await getSpecificFractionalNftList(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C"
    // );
    // await getOwnerOf(
    //   "AS12qSLhxXzFPff854Ceb2o17ZNSdUvQFtjMo7pKcQVMUfayEGstL",
    //   2
    // );
    // await getFractions(
    //   "AS12qSLhxXzFPff854Ceb2o17ZNSdUvQFtjMo7pKcQVMUfayEGstL",
    //   2
    // );
    // await getFractionOwnership(
    //   "AS12qSLhxXzFPff854Ceb2o17ZNSdUvQFtjMo7pKcQVMUfayEGstL",
    //   2,
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C"
    // );
    // await getFractionApproved(
    //   "AS1kZ5hwEEGmmTBG4ikJmnrsjQAvu7ozXXv5jejNonMUwEBcWxD9",
    //   1,
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C"
    // );
    // await getSellOffer(
    //   "AS12qSLhxXzFPff854Ceb2o17ZNSdUvQFtjMo7pKcQVMUfayEGstL",
    //   1
    // );
    // await getNftOffer(
    //   "AS12n8b13njGwEdFB618nuJ8x45PfEGPjG5WuRJa1b4P4FRfji2cc",
    //   1
    // );
    // await getAuction(
    //   "AS12n8b13njGwEdFB618nuJ8x45PfEGPjG5WuRJa1b4P4FRfji2cc",
    //   3
    // );
    // await getBid("AS12n8b13njGwEdFB618nuJ8x45PfEGPjG5WuRJa1b4P4FRfji2cc", 3);
    // await getFracSellOffer(
    //   "AU12pGAyJWCbnPpfkaQLmf7bABLxd9TaJ3EUpQGVGNN5wmDXcgk6C",
    //   "AS1kZ5hwEEGmmTBG4ikJmnrsjQAvu7ozXXv5jejNonMUwEBcWxD9",
    //   1
    // );
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
