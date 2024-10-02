import {
  Args,
  IDeserializedResult,
  ISerializable,
} from "@massalabs/massa-web3";

export class MakeOffer implements ISerializable<MakeOffer> {
  constructor(
    public offerer: string = "",
    public collectionAddress: string = "",
    public tokenId: bigint = BigInt(0),
    public offerPrice: bigint = BigInt(0),
    public offerTime: bigint = BigInt(0)
  ) {}

  serialize(): Uint8Array {
    const args = new Args()
      .addString(this.offerer)
      .addString(this.collectionAddress)
      .addU256(this.tokenId)
      .addU64(this.offerPrice)
      .addU64(this.offerTime)
      .serialize();
    return Uint8Array.from(args);
  }

  deserialize(
    buffer: Uint8Array,
    offset: number
  ): IDeserializedResult<MakeOffer> {
    const args = new Args(buffer, offset);

    this.offerer = args.nextString();
    this.collectionAddress = args.nextString();
    this.tokenId = args.nextU256();
    this.offerPrice = args.nextU64();
    this.offerTime = args.nextU64();

    return {
      instance: this,
      offset: args.getOffset(),
    };
  }
}
