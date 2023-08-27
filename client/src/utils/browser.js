import {
  Celo,
  CeloAlfajoresTestnet,
  CeloBaklavaTestnet,
  Mumbai,
  Polygon,
  getChainByChainId,
} from "@thirdweb-dev/chains";
import { C as Connector } from "../../../../dist/connector-05689d68.browser.esm.js";
import { PaymasterAPI, calcPreVerificationGas } from "@account-abstraction/sdk";
import { ethers, utils, Signer, providers, BigNumber } from "ethers";
import fetch from "cross-fetch";
import { i as isTwUrl } from "../../../../dist/url-bc88b2b6.browser.esm.js";
import { EntryPoint__factory } from "@account-abstraction/contracts";
import { _ as _defineProperty } from "../../../../dist/defineProperty-c8ecdc07.browser.esm.js";
import { deepHexlify, packUserOp } from "@account-abstraction/utils";
import {
  getPolygonGasPriorityFee,
  ThirdwebSDK,
  LOCAL_NODE_PKEY,
  getChainProvider,
} from "@thirdweb-dev/sdk";
import "eventemitter3";

function toJSON(op) {
  return ethers.utils.resolveProperties(op).then((userOp) =>
    Object.keys(userOp)
      .map((key) => {
        let val = userOp[key];
        if (typeof val !== "string" || !val.startsWith("0x")) {
          val = ethers.utils.hexValue(val);
        }
        return [key, val];
      })
      .reduce((set, _ref) => {
        let [k, v] = _ref;
        return {
          ...set,
          [k]: v,
        };
      }, {})
  );
}

// v0.6 userOpHash calculation
async function getUserOpHashV06(userOp, entryPoint, chainId) {
  const op = await utils.resolveProperties(userOp);
  const hashedUserOp = {
    sender: op.sender,
    nonce: op.nonce,
    initCodeHash: utils.keccak256(op.initCode),
    callDataHash: utils.keccak256(op.callData),
    callGasLimit: op.callGasLimit,
    verificationGasLimit: op.verificationGasLimit,
    preVerificationGas: op.preVerificationGas,
    maxFeePerGas: op.maxFeePerGas,
    maxPriorityFeePerGas: op.maxPriorityFeePerGas,
    paymasterAndDataHash: utils.keccak256(op.paymasterAndData),
  };
  const userOpType = {
    components: [
      {
        type: "address",
        name: "sender",
      },
      {
        type: "uint256",
        name: "nonce",
      },
      {
        type: "bytes32",
        name: "initCodeHash",
      },
      {
        type: "bytes32",
        name: "callDataHash",
      },
      {
        type: "uint256",
        name: "callGasLimit",
      },
      {
        type: "uint256",
        name: "verificationGasLimit",
      },
      {
        type: "uint256",
        name: "preVerificationGas",
      },
      {
        type: "uint256",
        name: "maxFeePerGas",
      },
      {
        type: "uint256",
        name: "maxPriorityFeePerGas",
      },
      {
        type: "bytes32",
        name: "paymasterAndDataHash",
      },
    ],
    name: "hashedUserOp",
    type: "tuple",
  };
  const encoded = utils.defaultAbiCoder.encode(
    [userOpType],
    [
      {
        ...hashedUserOp,
      },
    ]
  );
  // remove leading word (total length) and trailing word (zero-length signature)

  const userOpHash = utils.keccak256(encoded);
  const enc = utils.defaultAbiCoder.encode(
    ["bytes32", "address", "uint256"],
    [userOpHash, entryPoint, chainId]
  );
  return utils.keccak256(enc);
}

const SIG_SIZE = 65;
const DUMMY_PAYMASTER_AND_DATA =
  "0x0101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000001010101010100000000000000000000000000000000000000000000000000000000000000000101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101";
class VerifyingPaymasterAPI extends PaymasterAPI {
  constructor(paymasterUrl, entryPoint, clientId, secretKey) {
    super();
    this.paymasterUrl = paymasterUrl;
    this.entryPoint = entryPoint;
    this.clientId = clientId;
    this.secretKey = secretKey;
  }
  async getPaymasterAndData(userOp) {
    const headers = {
      "Content-Type": "application/json",
    };
    if (isTwUrl(this.paymasterUrl)) {
      if (this.secretKey) {
        headers["x-secret-key"] = this.secretKey;
      } else if (this.clientId) {
        headers["x-client-id"] = this.clientId;
        if (
          typeof globalThis !== "undefined" &&
          "APP_BUNDLE_ID" in globalThis
        ) {
          headers["x-bundle-id"] = globalThis.APP_BUNDLE_ID;
        }
      }
      if (
        typeof globalThis !== "undefined" &&
        "TW_AUTH_TOKEN" in globalThis &&
        typeof globalThis.TW_AUTH_TOKEN === "string"
      ) {
        headers["authorization"] = `Bearer ${globalThis.TW_AUTH_TOKEN}`;
      }
    }

    // Ask the paymaster to sign the transaction and return a valid paymasterAndData value.
    const response = await fetch(this.paymasterUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "pm_sponsorUserOperation",
        params: [
          await toJSON(userOp),
          {
            entryPoint: this.entryPoint,
          },
        ],
      }),
    });
    const res = await response.json();
    if (!response.ok) {
      const error = res.error || response.statusText;
      const code = res.code || "UNKNOWN";
      throw new Error(`Paymaster error: ${error}
Status: ${response.status}
Code: ${code}`);
    }
    if (res.result) {
      const result = res.result.paymasterAndData || res.result;
      return result.toString();
    } else {
      throw new Error(`Paymaster returned no result from ${this.paymasterUrl}`);
    }
  }
}
const getVerifyingPaymaster = (paymasterUrl, entryPoint, clientId, secretKey) =>
  new VerifyingPaymasterAPI(paymasterUrl, entryPoint, clientId, secretKey);

/**
 * This class encapsulates Ethers.js listener function and necessary UserOperation details to
 * discover a TransactionReceipt for the operation.
 *
 * TODO refactor this to a simple event listener on the entry point
 */
class UserOperationEventListener {
  constructor(resolve, reject, entryPoint, sender, userOpHash, nonce, timeout) {
    this.resolve = resolve;
    this.reject = reject;
    this.entryPoint = entryPoint;
    this.sender = sender;
    this.userOpHash = userOpHash;
    this.nonce = nonce;
    this.timeout = timeout;
    _defineProperty(this, "resolved", false);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.boundLisener = this.listenerCallback.bind(this);
  }
  start() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const filter = this.entryPoint.filters.UserOperationEvent(this.userOpHash);
    // listener takes time... first query directly:
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      const res = await this.entryPoint.queryFilter(filter, "latest");
      if (res.length > 0) {
        void this.listenerCallback(res[0]);
      } else {
        this.entryPoint.once(filter, this.boundLisener);
      }
    }, 100);
  }
  stop() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.entryPoint.off("UserOperationEvent", this.boundLisener);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listenerCallback() {
    for (
      var _len = arguments.length, param = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      param[_key] = arguments[_key];
    }
    // TODO clean this up..
    // eslint-disable-next-line prefer-rest-params
    const event = arguments[arguments.length - 1];
    if (!event.args) {
      console.error("got event without args", event);
      return;
    }
    // TODO: can this happen? we register to event by userOpHash..
    if (event.args.userOpHash !== this.userOpHash) {
      console.log(
        `== event with wrong userOpHash: sender/nonce: event.${
          event.args.sender
        }@${event.args.nonce.toString()}!= userOp.${this.sender}@${parseInt(
          this.nonce?.toString()
        )}`
      );
      return;
    }
    const transactionReceipt = await event.getTransactionReceipt();

    // before returning the receipt, update the status from the event.
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!event.args.success) {
      await this.extractFailureReason(transactionReceipt);
    }
    this.stop();
    this.resolve(transactionReceipt);
    this.resolved = true;
  }
  async extractFailureReason(receipt) {
    receipt.status = 0;
    const revertReasonEvents = await this.entryPoint.queryFilter(
      this.entryPoint.filters.UserOperationRevertReason(
        this.userOpHash,
        this.sender
      ),
      receipt.blockHash
    );
    if (revertReasonEvents[0]) {
      let message = revertReasonEvents[0].args.revertReason;
      if (message.startsWith("0x08c379a0")) {
        // Error(string)
        message = utils.defaultAbiCoder
          .decode(["string"], "0x" + message.substring(10))
          .toString();
      }
      this.reject(new Error(`UserOp failed with reason: ${message}`));
    }
  }
}

class ERC4337EthersSigner extends Signer {
  // TODO: we have 'erc4337provider', remove shared dependencies or avoid two-way reference
  constructor(
    config,
    originalSigner,
    erc4337provider,
    httpRpcClient,
    smartAccountAPI
  ) {
    super();
    utils.defineReadOnly(this, "provider", erc4337provider);
    this.config = config;
    this.originalSigner = originalSigner;
    this.erc4337provider = erc4337provider;
    this.httpRpcClient = httpRpcClient;
    this.smartAccountAPI = smartAccountAPI;
  }
  // This one is called by Contract. It signs the request and passes in to Provider to be sent.
  async sendTransaction(transaction) {
    let batched =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    const tx = await ethers.utils.resolveProperties(transaction);
    await this.verifyAllNecessaryFields(tx);
    const userOperation = await this.smartAccountAPI.createSignedUserOp(
      {
        target: tx.to || "",
        data: tx.data?.toString() || "0x",
        value: tx.value,
        gasLimit: tx.gasLimit,
      },
      batched
    );
    const transactionResponse =
      await this.erc4337provider.constructUserOpTransactionResponse(
        userOperation
      );
    try {
      await this.httpRpcClient.sendUserOpToBundler(userOperation);
    } catch (error) {
      throw this.unwrapError(error);
    }
    // TODO: handle errors - transaction that is "rejected" by bundler is _not likely_ to ever resolve its "wait()"
    return transactionResponse;
  }
  unwrapError(errorIn) {
    try {
      let errorMsg = "Unknown Error";
      if (errorIn.error) {
        errorMsg = `The bundler has failed to include UserOperation in a batch: ${errorIn.error}`;
      } else if (errorIn.body && typeof errorIn.body === "string") {
        const errorBody = JSON.parse(errorIn.body);
        const errorStatus = errorIn.status || "UNKNOWN";
        const errorCode = errorBody?.code || "UNKNOWN";
        let failedOpMessage =
          errorBody?.error?.message ||
          errorBody?.error?.data ||
          errorBody?.error ||
          errorIn.reason;
        if (failedOpMessage?.includes("FailedOp")) {
          let paymasterInfo = "";
          // TODO: better error extraction methods will be needed
          const matched = failedOpMessage.match(/FailedOp\((.*)\)/);
          if (matched) {
            const split = matched[1].split(",");
            paymasterInfo = `(paymaster address: ${split[1]})`;
            failedOpMessage = split[2];
          }
          errorMsg = `The bundler has failed to include UserOperation in a batch: ${failedOpMessage} ${paymasterInfo}`;
        } else {
          errorMsg = `RPC error: ${failedOpMessage}
Status: ${errorStatus}
Code: ${errorCode}`;
        }
      }
      const error = new Error(errorMsg);
      error.stack = errorIn.stack;
      return error;
    } catch (error) {}
    return errorIn;
  }
  async verifyAllNecessaryFields(transactionRequest) {
    if (!transactionRequest.to) {
      throw new Error("Missing call target");
    }
    if (!transactionRequest.data && !transactionRequest.value) {
      // TBD: banning no-op UserOps seems to make sense on provider level
      throw new Error("Missing call data or value");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect(provider) {
    throw new Error("changing providers is not supported");
  }
  async getAddress() {
    if (!this.address) {
      this.address = await this.erc4337provider.getSenderAccountAddress();
    }
    return this.address;
  }
  async signMessage(message) {
    const isNotDeployed = await this.smartAccountAPI.checkAccountPhantom();
    if (isNotDeployed) {
      console.log(
        "Account contract not deployed yet. Deploying account before signing message"
      );
      const tx = await this.sendTransaction({
        to: await this.getAddress(),
        data: "0x",
      });
      await tx.wait();
    }
    return await this.originalSigner.signMessage(message);
  }
  async signTransaction(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transaction
  ) {
    throw new Error("not implemented");
  }
}

class ERC4337EthersProvider extends providers.BaseProvider {
  constructor(
    chainId,
    config,
    originalSigner,
    originalProvider,
    httpRpcClient,
    entryPoint,
    smartAccountAPI
  ) {
    super({
      name: "ERC-4337 Custom Network",
      chainId,
    });
    this.chainId = chainId;
    this.config = config;
    this.originalSigner = originalSigner;
    this.originalProvider = originalProvider;
    this.httpRpcClient = httpRpcClient;
    this.entryPoint = entryPoint;
    this.smartAccountAPI = smartAccountAPI;
    this.signer = new ERC4337EthersSigner(
      config,
      originalSigner,
      this,
      httpRpcClient,
      smartAccountAPI
    );
  }

  /**
   * finish intializing the provider.
   * MUST be called after construction, before using the provider.
   */
  async init() {
    // await this.httpRpcClient.validateChainId()
    this.initializedBlockNumber = await this.originalProvider.getBlockNumber();
    await this.smartAccountAPI.init();
    // await this.signer.init()
    return this;
  }
  getSigner() {
    return this.signer;
  }
  async perform(method, params) {
    if (method === "sendTransaction" || method === "getTransactionReceipt") {
      // TODO: do we need 'perform' method to be available at all?
      // there is nobody out there to use it for ERC-4337 methods yet, we have nothing to override in fact.
      throw new Error("Should not get here. Investigate.");
    }
    if (method === "estimateGas") {
      // hijack this to estimate gas from the entrypoint instead
      const { callGasLimit } =
        await this.smartAccountAPI.encodeUserOpCallDataAndGasLimit(
          {
            target: params.transaction.to,
            data: params.transaction.data,
            value: params.transaction.value,
            gasLimit: params.transaction.gasLimit,
          },
          false // TODO check this
        );

      return callGasLimit;
    }
    return await this.originalProvider.perform(method, params);
  }
  async getTransaction(transactionHash) {
    // TODO
    return await super.getTransaction(transactionHash);
  }
  async getTransactionReceipt(transactionHash) {
    const userOpHash = await transactionHash;
    const sender = await this.getSenderAccountAddress();
    return await new Promise((resolve, reject) => {
      new UserOperationEventListener(
        resolve,
        reject,
        this.entryPoint,
        sender,
        userOpHash
      ).start();
    });
  }
  async getSenderAccountAddress() {
    return await this.smartAccountAPI.getAccountAddress();
  }
  async waitForTransaction(transactionHash, confirmations, timeout) {
    const sender = await this.getSenderAccountAddress();
    return await new Promise((resolve, reject) => {
      const listener = new UserOperationEventListener(
        resolve,
        reject,
        this.entryPoint,
        sender,
        transactionHash,
        undefined,
        timeout
      );
      listener.start();
    });
  }

  // fabricate a response in a format usable by ethers users...
  async constructUserOpTransactionResponse(userOp1) {
    const userOp = await utils.resolveProperties(userOp1);
    const userOpHash = await this.smartAccountAPI.getUserOpHash(userOp);
    const waitForUserOp = async () =>
      await new Promise((resolve, reject) => {
        new UserOperationEventListener(
          resolve,
          reject,
          this.entryPoint,
          userOp.sender,
          userOpHash,
          userOp.nonce
        ).start();
      });
    return {
      hash: userOpHash,
      confirmations: 0,
      from: userOp.sender,
      nonce: BigNumber.from(userOp.nonce).toNumber(),
      gasLimit: BigNumber.from(userOp.callGasLimit),
      // ??
      value: BigNumber.from(0),
      data: utils.hexValue(userOp.callData),
      // should extract the actual called method from this "execFromEntryPoint()" call
      chainId: this.chainId,
      wait: async (confirmations) => {
        const transactionReceipt = await waitForUserOp();
        if (userOp.initCode.length !== 0) {
          // checking if the wallet has been deployed by the transaction; it must be if we are here
          await this.smartAccountAPI.checkAccountPhantom();
        }
        return transactionReceipt;
      },
    };
  }
  async detectNetwork() {
    return this.originalProvider.detectNetwork();
  }
}
