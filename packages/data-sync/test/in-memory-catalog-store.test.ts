import { describeCatalogStoreContract } from './catalog-store-contract.js';
import { InMemoryCatalogStore } from './in-memory-catalog-store.js';

describeCatalogStoreContract('InMemoryCatalogStore', () => {
  const store = new InMemoryCatalogStore();
  const ids = (active: boolean) =>
    [...store.cards.entries()]
      .filter(([, stored]) => stored.isActive === active)
      .map(([eaId]) => eaId)
      .sort((a, b) => a - b);

  return Promise.resolve({
    store,
    card: (eaId) => Promise.resolve(store.cards.get(eaId)?.card ?? null),
    activeCardIds: () => Promise.resolve(ids(true)),
    inactiveCardIds: () => Promise.resolve(ids(false)),
    sync: (id) => {
      const sync = store.syncs.find((record) => record.id === id);
      return sync ? Promise.resolve(sync) : Promise.reject(new Error(`no sync ${id}`));
    },
  });
});
