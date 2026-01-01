package com.app.budgetbuddy.services;

import java.util.List;
import java.util.Set;

public interface CSVUploaderService<I, C, E>
{
    Set<C> createCSVList(List<I> csvList, Long userId);
    List<E> createEntityList(Set<C> csvList);

    void saveEntities(List<E> entities);
}
