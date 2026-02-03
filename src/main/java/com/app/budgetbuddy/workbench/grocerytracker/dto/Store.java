package com.app.budgetbuddy.workbench.grocerytracker.dto;

import jakarta.persistence.Embeddable;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class Store
{
    private String name;
    private String address;
    private String category;
    private String description;
}
