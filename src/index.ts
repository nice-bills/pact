export { MutualAidPool, MEMBER_STREAM_GRACE_PERIOD_MS } from "./core/pool.js";
export { openContributionStream, closeContributionStream, getStreamInfo } from "./core/streaming.js";
export type {
  PoolConfig,
  PoolMember,
  Claim,
  ClaimSubmission,
  SignedClaimSubmission,
  ClaimCreationResult,
  ClaimLifecycleTxs,
  ClaimStatus,
  AgentRecommendation,
} from "./core/types.js";
