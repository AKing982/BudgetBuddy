package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
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

    @Column(name="categoryId", unique = true, length=50)
    private String categoryId;

    @Column(name="name")
    private String name;

    @Column(name="description")
    private String description;

    @Column(name="type")
    private String type;

    @Column(name="is_active")
    private boolean isActive;

    @Column(name="is_custom")
    private boolean isCustom;

    @Column(name="createdBy")
    private Long createdBy;

    @Column(name="createdat")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdat;

    @OneToMany(mappedBy="category")
    private List<TransactionsEntity> transactions;

    public CategoryEntity(Long id, String categoryId, String name, String description) {
        this.id = id;
        this.categoryId = categoryId;
        this.name = name;
        this.description = description;
    }
}
