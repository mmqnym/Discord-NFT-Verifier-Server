declare namespace v {
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
}
