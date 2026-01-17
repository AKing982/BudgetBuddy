package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

@Table(name="UserCategories")
@Entity
@Getter
@Setter
@TableGenerator(name = "UserCategories")
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class UserCategoryEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userId")
    private UserEntity user;

    @Column(name="category")
    private String category;

    @Column(name="is_active")
    private Boolean isActive;

    @Column(name="type")
    private String type;

    @Column(name="is_system_override")
    private Boolean isSystemOverride;

    @Column(name="created_at")
    private Timestamp createdAt;


}
