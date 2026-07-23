import type { AssetId } from "@ryvra/contracts";

import type { SandboxContext } from "../context.js";

export const isAssetRestricted = (context: SandboxContext, assetId: AssetId): boolean =>
  context.assetRestrictions.get(assetId) ?? false;
