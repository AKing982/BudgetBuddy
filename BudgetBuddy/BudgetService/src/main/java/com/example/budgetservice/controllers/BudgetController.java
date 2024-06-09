package com.example.budgetservice.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

@RestController(value="/api/budgets")
@CrossOrigin(value = "http://localhost:3000")
public class BudgetController {
}
