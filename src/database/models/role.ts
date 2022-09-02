import mongoose from "mongoose";

/**
 * @property tokenAddress: A token contract address.
 * @property roles: Roles attributes
 * @property roles.roleName: It's only used to display to the user, so it does not have to be correct.
 * If you want to set the discord role by name, you must set its value to the latest
 * @property roles.roleId: It's used to set discord role, must be correct.
 * @property roles.requiredAmount: The minimum amount of NFT holding required to get this role
 */
const roleSchema = new mongoose.Schema({
  tokenAddress: {
    type: String,
    required: true,
  },
  roles: {
    type: [
      {
        roleName: { type: String, required: true },
        roleId: { type: String, required: true },
        requiredAmount: { type: Number, required: true },
      },
    ],
    required: true,
  },
});

export const roleModel = mongoose.model("role", roleSchema, "role");
