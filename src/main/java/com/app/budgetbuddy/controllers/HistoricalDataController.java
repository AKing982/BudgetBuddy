package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.workbench.subBudget.HistoricalDataEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/historical")
@CrossOrigin(origins="http://localhost:3000")
public class HistoricalDataController
{
    private final HistoricalDataEngine historicalDataEngine;

    @Autowired
    public HistoricalDataController(HistoricalDataEngine historicalDataEngine)
    {
        this.historicalDataEngine = historicalDataEngine;
    }


}
