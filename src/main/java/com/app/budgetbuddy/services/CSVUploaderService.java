package com.app.budgetbuddy.services;

import java.util.List;

public interface CSVUploaderService<I, C, E>
{
    List<C> createCSVList(List<I> csvList, Long userId);
    List<E> createEntityList(List<C> csvList);

    void saveEntities(List<E> entities);
}
