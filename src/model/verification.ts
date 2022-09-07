import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/evm-utils";
import configs from "../configs.json";

/**
 * Call Moralis API to get the user's an NFT collection holding amount.
 *
 * @param obj An verify info records token contract address and roles information.
 * @returns {Promise<VerifiedResult>} The user's NFT holding amount.
 */
const callVerifiedAPI = async (
  walletAddress: string,
  obj: Verifying.RoleSettings
): Promise<Verifying.VerifiedResult> => {
  const chain = EvmChain.CRONOS;
  const address: string = walletAddress;
  const format: "decimal" = "decimal";
  const limit: number = 1;
  const tokenAddress: string = obj.tokenAddress;

  let result: Verifying.VerifiedResult = {
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
    console.log(
      `TokenAddress: ${tokenAddress} HoldingAmount: ${userHoldingAmount}`
    );

    result.total = userHoldingAmount;
    result.roles = obj.roles;
  } catch (error) {
    console.error(error);
    result.total = -1;
    result.roles.length = 0;
  } finally {
    return result;
  }
};

/**
 * Record the roles available to the user.
 *
 * @param record The user's NFT and the corresponding available roles.
 * @returns The roles recorded.
 */
const recordRoles = (record: Verifying.VerifiedResult) => {
  let recordedRoles: Array<Verifying.Role> = [];

  record.roles.forEach((roleData: Verifying.Role) => {
    if (record.total >= roleData.requiredAmount) {
      recordedRoles.push(roleData);
    }
  });

  return recordedRoles;
};

/**
 * Execute the verify operation.
 * Note that if you add more than 25 contract addresses in your database,
 * you must split the promises into multiple groups before calling the Moralis API,
 * unless you are using the paid API.
 *
 * @returns {Promise<Array<Role>>} The objects of the roles that the user will be assigned.
 */
export const verify = async (
  walletAddress: string,
  waitingCheckAddressInfo: Array<Verifying.RoleSettings>
): Promise<Array<Verifying.Role>> => {
  let promises: Array<Promise<Verifying.VerifiedResult>> = [];
  let verifiedResults: Array<Verifying.VerifiedResult> = [];
  let recordedRoles: Array<Verifying.Role> = [];

  try {
    for (let i = 0; i < waitingCheckAddressInfo.length; i++) {
      promises.push(callVerifiedAPI(walletAddress, waitingCheckAddressInfo[i]));
    }

    console.log(`Account: ${walletAddress}\n=====`);
    verifiedResults = await Promise.all(promises);

    for (let i = 0; i < verifiedResults.length; i++) {
      recordedRoles = recordedRoles.concat(recordRoles(verifiedResults[i]));
    }
  } catch (error) {
    console.error(error);
    recordedRoles.length = 0;
  } finally {
    console.log("=====");
    return recordedRoles;
  }
};

/**
 * Convert the Role objects to discord id strings.
 * @param roles Array of Roles.
 * @returns Role ids in string.
 */
export const rolesToIdsString = (roles: Array<Verifying.Role>) => {
  let roleIds: Array<string> = [];

  roles.forEach((roleInfo) => {
    roleIds.push(roleInfo.roleId);
  });

  return roleIds;
};
