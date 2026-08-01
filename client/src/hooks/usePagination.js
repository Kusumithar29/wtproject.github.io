import { useState, useCallback } from 'react';

export const usePagination = (initialLimit = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  }, []);

  const setPage = useCallback((page) => {
    const pageNum = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNum);
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    limit,
    nextPage,
    prevPage,
    setPage,
    setTotalPages,
    setLimit,
    setCurrentPage
  };
};

export default usePagination;
