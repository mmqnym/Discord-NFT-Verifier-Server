declare namespace Verifying {
  /**
   * To store information about a role.
   *
   * @member {string} roleName is a role name that belongs to the guild above.
   * @member {string} roleId is a role id that belongs to the guild above.
   * @member {number} requiredAmount is the NFT required amount that user can get this role.
   */
  interface Role {
    roleName: string;
    roleId: string;
    requiredAmount: number;
  }

  /**
   * Used to store a group of roles corresponding to a token contract address.
   *
   * @member {string} tokenAddress is the token contract address set by developer.
   * @member {array<Role>} roles is a group of roles that corresponds to the token contract address above.
   */
  interface RoleSettings {
    tokenAddress: string;
    roles: Array<Role>;
  }

  /**
   * Used to store the amount of NFTs owned by the user for the token contracts set by the developer.
   *
   * @member {Number} total is the user's hoding amount of a NFT collection.
   * @member {Array<Role>} roles is the group of roles settings to check if the user can get them.
   */
  interface VerifiedResult {
    total: number;
    roles: Array<Role>;
  }
}

declare namespace Verified {
  /**
   * Verified user information is used for periodic tracking.
   *
   * @member {string} discordId is the user's discord id.
   * @member {string} walletAddress is the user's verified wallet address.
   * @member {Array<string>} roleIds is a group of role ids that the user has obtained by verification process.
   */
  interface User {
    discordId: string;
    walletAddress: string;
    roleIds: Array<string>;
  }
}
