// @ts-nocheck
﻿import type { LayoutServerLoad } from './$types';

export const load = async ({ locals }: Parameters<LayoutServerLoad>[0]) => {
  const session = await locals.getSession();
  return { session };
};
