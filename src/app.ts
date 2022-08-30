import express, { Express, Request, Response } from "express";
import cors from "cors";
import configs from "./configs.json";

import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/evm-utils";
import { rejects } from "assert";

const port = configs.serverPort;

const app: Express = express();

app.use(express.json());

const corsOptions = {
  origin: ["http://localhost:11112"],
  methods: ["POST"],
  preflightContinue: true,
  allowedHeaders: ["Content-Type"],
};

/**
 * @member {string} roleName is discord role name.
 * @member {string} roleId is discord role id.
 * @member {number} requiredAmount is the NFT required amount that user can get this role.
 */
interface Role {
  roleName: string;
  roleId: string;
  requiredAmount: number;
}

/**
 * @member {string} tokenAddress is the token contract address set by developer.
 * @member {Array<Role>} roles is the identity group set by the developer corresponding to the NFT(s) held by the user.
 */
interface VerifyInfo {
  tokenAddress: string;
  roles: Array<Role>;
}

/**
 * @member {number} total is the user's hoding amount of a NFT collection.
 * @member {Array<Role>} roles is the identity group set by the developer corresponding to the NFT(s) held by the user.
 */
interface VerifiedResult {
  total: number;
  roles: Array<Role>;
}

app.post("/api", (request: Request, response: Response) => {
  /**
   * Call Moralis API to get the user's an NFT collection holding amount.
   * @param obj An verify info records token contract address and roles information.
   * @returns {Promise<VerifiedResult>} The user's NFT holding amount.
   */
  const callVerifiedAPI = async (obj: VerifyInfo): Promise<VerifiedResult> => {
    const chain = EvmChain.CRONOS;
    const address: string = request.body.walletAddress;
    const format: "decimal" = "decimal";
    const limit: number = 1;
    const tokenAddress: string = obj.tokenAddress;

    let result: VerifiedResult = {
      total: 0,
      roles: [],
    };

    try {
      await Moralis.start(configs.moralis);

      const verifiedResponse = await Moralis.EvmApi.account.getNFTsForContract({
        address,
        chain,
        tokenAddress,
        format,
        limit,
      });

      const userHoldingAmount = verifiedResponse.raw.total;
      console.log(`userHoldingNumber: ${userHoldingAmount}`); // for debug

      result.total = userHoldingAmount;
      result.roles = obj.roles;
    } catch (error) {
      console.log(error);
      result.total = -1;
      result.roles.length = 0;
    } finally {
      return result;
    }
  };

  /**
   * Record the roles available to the user.
   * @param record The user's NFT and the corresponding available roles.
   * @returns The names of the roles recorded.
   */
  const recordRoles = (record: VerifiedResult) => {
    let recordedRoles: Array<Role> = [];

    record.roles.forEach((roleData: Role) => {
      // for debug
      console.log(`record.total: ${record.total}`);
      console.log(`roleData.requiredAmount: ${roleData.requiredAmount}`);
      if (record.total >= roleData.requiredAmount) {
        recordedRoles.push(roleData);
      }
    });

    return recordedRoles;
  };

  /**
   * Execute the verify operation.
   * Note that if you add more than 25 contract addresses in configs.json,
   * you must split the promises into multiple groups before calling the Moralis API,
   * unless you are using the paid API.
   * @returns {Promise<Array<Role>>} The objects of the roles that the user will be assigned.
   */
  const process = async (): Promise<Array<Role>> => {
    let promises: Array<Promise<VerifiedResult>> = [];
    const waitingCheckAddressInfo = configs.CheckingTokenAddresses;
    let verifiedResults: Array<VerifiedResult> = [];
    let recordedRoles: Array<Role> = [];

    try {
      for (let i = 0; i < waitingCheckAddressInfo.length; i++) {
        promises.push(callVerifiedAPI(waitingCheckAddressInfo[i]));
      }

      verifiedResults = await Promise.all(promises);

      for (let i = 0; i < verifiedResults.length; i++) {
        recordedRoles = recordedRoles.concat(recordRoles(verifiedResults[i]));
      }
    } catch (error) {
      console.log(error);
      recordedRoles.length = 0;
    } finally {
      return recordedRoles;
    }
  };

  // Got a request from client.
  try {
    console.log(`Request from client IP Address: ${request.ip}`);

    (async () => {
      const recordedRoles = await process();

      if (recordedRoles.length > 0) {
        response.json({
          status: "OK",
          message: "You will get the below role(s) soon.",
          roles: recordedRoles,
        });
      } else {
        response.json({
          status: "Zero",
          message: "You don't have the NFT(s) we set!",
          roles: [],
        });
      }
    })();
  } catch (error: any) {
    console.log(error);
    response.json({
      status: "ERR",
      message: error.message,
      roles: [],
    });
  }
});

app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`);
});
