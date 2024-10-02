import {
  Args,
  IDeserializedResult,
  ISerializable,
} from "@massalabs/massa-web3";

export class Bid implements ISerializable<Bid> {
  constructor(
    public bidder: string = "",
    public collectionAddress: string = "",
    public tokenId: bigint = BigInt(0),
    public bidAmount: bigint = BigInt(0),
    public bidTime: bigint = BigInt(0)
  ) {}

  serialize(): Uint8Array {
    const args = new Args()
      .addString(this.bidder)
      .addString(this.collectionAddress)
      .addU256(this.tokenId)
      .addU64(this.bidAmount)
      .addU64(this.bidTime)
      .serialize();
    return Uint8Array.from(args);
  }

  deserialize(buffer: Uint8Array, offset: number): IDeserializedResult<Bid> {
    const args = new Args(buffer, offset);

    this.bidder = args.nextString();
    this.collectionAddress = args.nextString();
    this.tokenId = args.nextU256();
    this.bidAmount = args.nextU64();
    this.bidTime = args.nextU64();

    return {
      instance: this,
      offset: args.getOffset(),
    };
  }
}
