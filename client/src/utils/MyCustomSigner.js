// MyCustomSigner.js
import { toUtf8Bytes, Logger, hexlify, logger } from "ethers/lib/utils";

class MyCustomSigner {
  constructor(originalSigner) {
    this.originalSigner = originalSigner;
  }

  async signTransaction(transaction, batched = false) {
    console.log("My custom sendTransaction method is being called!");
    return this.originalSigner.signTransaction(transaction, batched);
  }

  async signMessage(message) {
    const data = typeof message === "string" ? toUtf8Bytes(message) : message;
    const address = await this.originalSigner.getAddress();
    try {
      return await this.originalSigner.originalSigner.provider.send(
        "personal_sign",
        [hexlify(data), address.toLowerCase()]
      );
    } catch (error) {
      if (
        typeof error.message === "string" &&
        error.message.match(/user denied/i)
      ) {
        logger.throwError(
          "user rejected signing",
          Logger.errors.ACTION_REJECTED,
          {
            action: "signMessage",
            from: address,
            messageData: message,
          }
        );
      }
      throw error;
    }
  }

  // Forward all other method calls to the original signer
  otherMethod(...args) {
    return this.originalSigner.otherMethod(...args);
  }
}

export default MyCustomSigner;
