package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="merchants")
@Getter
@Setter
public class MerchantsEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="merchantName")
    private String name;

    @Column(name="merchantCaetgory")
    private String category;

    @Column(name="date_added")
    private String dateAdded;


}
