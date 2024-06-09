package com.example.budgetservice.workbench.services;


import java.util.List;
import java.util.Optional;

public interface ServiceDAO<T>
{
    void save(T entity);
    void delete(T entity);
    Optional<T> findById(Long id);
    List<T> findAll();
}
