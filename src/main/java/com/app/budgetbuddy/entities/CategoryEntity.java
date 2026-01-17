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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="plaid_category_id")
    private String plaidCategoryId;

    @Column(name="plaid_category")
    private String plaidCategory;

    @Column(name="category")
    private String category;

    @Column(name="description")
    private String description;

    @Column(name="is_active")
    private boolean isActive;

    @Column(name="is_custom")
    private boolean isCustom;

    @Column(name="created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdat;

}
