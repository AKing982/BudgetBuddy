package com.example.userservice.workbench.services;

import java.util.List;
import java.util.Optional;

public interface ServiceDAO<T>
{
    void save(T t);
    void update(T t);
    void delete(T t);
    void deleteAll();
    Optional<T> findById(Long id);
    List<T> findAll();
}
