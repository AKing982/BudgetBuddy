package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name="user_categories")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCategoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="user_id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="categoryid")
    private CategoryEntity category;

    @Column(name="createdat")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdat;


}
