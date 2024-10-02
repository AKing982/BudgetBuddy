package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name="categories")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryEntity
{

    @Id
    @Column(name="categoryid")
    private String id;

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

    @OneToMany(mappedBy="category")
    private Set<UserCategoryEntity> userCategories = new HashSet<>();

    public CategoryEntity(String categoryId, String name, String description) {
        this.id = categoryId;
        this.name = name;
        this.description = description;
    }
}
