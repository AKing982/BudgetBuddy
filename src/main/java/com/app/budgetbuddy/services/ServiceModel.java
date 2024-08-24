package com.app.budgetbuddy.services;

import java.util.Collection;
import java.util.Optional;

public interface ServiceModel<T>
{
    Collection<T> findAll();
    void save(T t);
    void delete(T t);
    Optional<T> findById(Long id);
}
