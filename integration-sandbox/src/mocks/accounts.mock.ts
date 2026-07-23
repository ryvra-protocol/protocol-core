import type { AccountId } from "@ryvra/contracts";

import type { SandboxContext } from "../context.js";

export const createAccount = (context: SandboxContext, accountId: AccountId, jurisdiction = "US"): void => {
  context.accounts.set(accountId, { jurisdiction });
};
