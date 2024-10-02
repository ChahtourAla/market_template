import {
  Args,
  IDeserializedResult,
  ISerializable,
} from "@massalabs/massa-web3";

export class SellFractionOffer implements ISerializable<SellFractionOffer> {
  constructor(
    public seller: string = "",
    public collectionAddress: string = "",
    public tokenId: bigint = BigInt(0),
    public fractions: bigint = BigInt(0),
    public price: bigint = BigInt(0),
    public expirationTime: bigint = BigInt(0)
  ) {}

  serialize(): Uint8Array {
    const args = new Args()
      .addString(this.seller)
      .addString(this.collectionAddress)
      .addU256(this.tokenId)
      .addU64(this.fractions)
      .addU64(this.price)
      .addU64(this.expirationTime)
      .serialize();
    return Uint8Array.from(args);
  }

  deserialize(
    buffer: Uint8Array,
    offset: number
  ): IDeserializedResult<SellFractionOffer> {
    const args = new Args(buffer, offset);

    this.seller = args.nextString();
    this.collectionAddress = args.nextString();
    this.tokenId = args.nextU256();
    this.fractions = args.nextU64();
    this.price = args.nextU64();
    this.expirationTime = args.nextU64();

    return {
      instance: this,
      offset: args.getOffset(),
    };
  }
}
