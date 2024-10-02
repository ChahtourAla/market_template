import {
  Args,
  IDeserializedResult,
  ISerializable,
} from "@massalabs/massa-web3";

export class HistorySales implements ISerializable<HistorySales> {
  constructor(
    public saleType: string = "",
    public seller: string = "",
    public buyer: string = "",
    public collectionAddress: string = "",
    public tokenId: bigint = BigInt(0),
    public salePrice: bigint = BigInt(0),
    public saleTime: bigint = BigInt(0)
  ) {}

  serialize(): Uint8Array {
    const args = new Args()
      .addString(this.saleType)
      .addString(this.seller)
      .addString(this.buyer)
      .addString(this.collectionAddress)
      .addU256(this.tokenId)
      .addU64(this.salePrice)
      .addU64(this.saleTime)
      .serialize();
    return Uint8Array.from(args);
  }

  deserialize(
    buffer: Uint8Array,
    offset: number
  ): IDeserializedResult<HistorySales> {
    const args = new Args(buffer, offset);

    this.saleType = args.nextString();
    this.seller = args.nextString();
    this.buyer = args.nextString();
    this.collectionAddress = args.nextString();
    this.tokenId = args.nextU256();
    this.salePrice = args.nextU64();
    this.saleTime = args.nextU64();

    return {
      instance: this,
      offset: args.getOffset(),
    };
  }
}
