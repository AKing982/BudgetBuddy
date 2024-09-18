package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name="users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="firstName")
    private String firstName;

    @Column(name="lastName")
    private String lastName;

    @Column(name="username")
    private String username;

    @Column(name="email")
    private String email;

    @Column(name="hashCombine")
    private String password;

    @Column(name="createdat")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdat;

    @OneToMany(mappedBy="user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserCategoryEntity> userCategories = new HashSet<>();

    public void addCategory(CategoryEntity category) {
        UserCategoryEntity userCategoryEntity = new UserCategoryEntity();
        userCategoryEntity.setCategory(category);
        userCategoryEntity.setUser(this);
        userCategoryEntity.setCreatedat(LocalDateTime.now());
        userCategories.add(userCategoryEntity);
    }

    public void removeCategory(CategoryEntity category) {
        userCategories.removeIf(uc -> uc.getCategory().equals(category));
    }

}
