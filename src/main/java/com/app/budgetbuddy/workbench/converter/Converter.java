package com.app.budgetbuddy.workbench.converter;

public interface Converter<M, E>
{
    E convert(M m);
}
