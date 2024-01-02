import { Layout } from 'pidby/config';

export type Size = R<{
  width: Num;
  height: Num;
}>

export type MultiSize = R<{
  in: Size;
  mm: Size;
}>

export const layoutSizes: RObj<Layout, MultiSize> = {
  [Layout.letter]: { in: { width: 8.5, height: 11 }, mm: { width: 216, height: 279 } },
  [Layout.legal]: { in: { width: 8.5, height: 14 }, mm: { width: 216, height: 356 } },
  [Layout.tabloid]: { in: { width: 11, height: 17 }, mm: { width: 279, height: 432 } },
  [Layout.ledger]: { in: { width: 17, height: 11 }, mm: { width: 432, height: 279 } },
  [Layout.a0]: { in: { width: 33.1, height: 46.8 }, mm: { width: 841, height: 1189 } },
  [Layout.a1]: { in: { width: 23.4, height: 33.1 }, mm: { width: 594, height: 841 } },
  [Layout.a2]: { in: { width: 16.54, height: 23.4 }, mm: { width: 420, height: 594 } },
  [Layout.a3]: { in: { width: 11.7, height: 16.54 }, mm: { width: 297, height: 420 } },
  [Layout.a4]: { in: { width: 8.27, height: 11.7 }, mm: { width: 210, height: 297 } },
  [Layout.a5]: { in: { width: 5.83, height: 8.27 }, mm: { width: 148.5, height: 210 } },
  [Layout.a6]: { in: { width: 4.13, height: 5.83 }, mm: { width: 105, height: 148.5 } },
};