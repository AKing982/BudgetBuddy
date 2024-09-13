package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name="categories")
@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="categoryid")
    private Long id;

    @Column(name="categoryRefNumber", unique = true, length=50)
    private String categoryRefNumber;

    @Column(name="categoryname")
    private String categoryname;

    @Column(name="categorydescription")
    private String categorydescription;

    @OneToMany(mappedBy="category")
    private List<TransactionsEntity> transactions;

    public CategoryEntity(Long id, String categoryId, String name, String description) {
        this.id = id;
        this.categoryRefNumber = categoryId;
        this.categoryname = name;
        this.categorydescription = description;
    }
}
