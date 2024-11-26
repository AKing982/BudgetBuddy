package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class CategoryDesignator
{
   private String categoryId;
   private String descriptionDesignator;
   private String nameDesignator;
   private boolean isSystemDefined;
   private boolean isActive;

}
