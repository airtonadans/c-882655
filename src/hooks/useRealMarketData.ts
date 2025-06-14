
/**
 * Hook removido, pois a busca dos dados agora será feita via upload para backend FastAPI.
 * Todas as funções apenas retornam mocks/vazios para compatibilidade do projeto.
 */
export const useRealMarketData = () => {
  return {
    isLoading: false,
    availableRanges: [],
    fetchKaggleData: async () => {},
    getMarketData: async () => [],
    refreshAvailableRanges: async () => {},
    clearAllData: async () => {},
  };
};
