import { SetMetadata } from '@nestjs/common';

export const CacheTTL = (seconds: number) => SetMetadata('cache_ttl', seconds);
export const NoCache = () => SetMetadata('cache_ttl', 0);
