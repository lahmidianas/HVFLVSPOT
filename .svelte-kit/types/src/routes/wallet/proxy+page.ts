// @ts-nocheck
﻿import type { PageLoad } from './$types';

export const load = async ({ parent }: Parameters<PageLoad>[0]) => {
  const { session } = await parent();
  return { session };
};
