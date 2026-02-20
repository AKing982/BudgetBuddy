package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Locations;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.exceptions.DataException;
import com.univocity.parsers.common.record.Record;
import com.univocity.parsers.csv.CsvFormat;
import com.univocity.parsers.csv.CsvParser;
import com.univocity.parsers.csv.CsvParserSettings;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
public class CSVParserService
{
    private static DateTimeFormatter[] DATE_FORMATTERS = {
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("M/d/yyyy"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("MM-dd-yyyy"),
            DateTimeFormatter.ISO_LOCAL_DATE

    };

    public List<TransactionCSV> parseCSV(MultipartFile file,
                                         String institutionName)
    {
        List<TransactionCSV> results = new ArrayList<>();
        try
        {
            if(file == null)
            {
                throw new DataException("File is null");
            }
            if(institutionName.isEmpty())
            {
                return Collections.emptyList();
            }
            CsvParserSettings settings = createParserSettings();
            CsvFormat format = new CsvFormat();
            format.setDelimiter(','); // Use tab delimiter
            settings.setFormat(format);
            CsvParser parser = new CsvParser(settings);
            try(InputStreamReader reader = new InputStreamReader(file.getInputStream()))
            {
                List<String[]> allRows = parser.parseAll(reader);
                SimpleDateFormat sdf = getDateFormatterByInstitution(institutionName);
                return buildTransactionCSVByInstitution(institutionName, allRows, results, sdf);
            }
        }catch(DataException e){
            log.error("There was an error while parsing the CSV file: {}", e.getMessage());
            throw e;
        }catch(IOException ex){
            log.error("There was an error with the file: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    private SimpleDateFormat getDateFormatterByInstitution(String institutionName)
    {
        switch(institutionName){
            case "Granite Credit Union":
                return new SimpleDateFormat("MM/d/yyyy");
            case "Mountain America Credit Union":
                return new SimpleDateFormat("MM/dd/yyyy");
            default:
                return new SimpleDateFormat("MM/dd/yyyy");
        }
    }

    private List<TransactionCSV> buildTransactionCSVByInstitution(String institutionName, List<String[]> allRows, List<TransactionCSV> results, SimpleDateFormat sdf)
    {
        for(String[] row : allRows)
        {
            TransactionCSV transactionCSV;
            switch(institutionName) {
                case "Granite Credit Union":
                    transactionCSV = buildGraniteCreditUnionTransaction(row, sdf);
                    break;
                case "Mountain America Credit Union":
                    transactionCSV = buildMountainAmericaTransaction(row, sdf);
                    break;
                default:
                    log.warn("Unknown institution: {}", institutionName);
                    continue;
            }
            results.add(transactionCSV);
        }
        return results;
    }

    private TransactionCSV buildGraniteCreditUnionTransaction(String[] row, SimpleDateFormat sdf)
    {
        log.info("Row: {}", row);
        log.info("Row Length: {}", row.length);
        TransactionCSV transactionCSV = new TransactionCSV();
        try
        {
            transactionCSV.setAccount(row[0]);
            transactionCSV.setSuffix(Integer.parseInt(row[1]));
            transactionCSV.setSequenceNo(removeLeadingZeros(row[2]));
            transactionCSV.setTransactionDate(convertDateToLocalDate(row[3], sdf));
            transactionCSV.setTransactionAmount(parseCurrency(row[4]));
            transactionCSV.setDescription(row[5]);
            transactionCSV.setExtendedDescription(row[6]);
            transactionCSV.setElectronicTransactionDate(convertDateToLocalDate(row[7], sdf));
            transactionCSV.setBalance(parseCurrency(row[9]));
            transactionCSV.setMerchantName(getMerchantNameByExtendedDescription(row[6], row[5]));
            transactionCSV.setInstitution_id("Granite Credit Union");
        }catch(Exception ex){
            log.error("There was an error parsing the CSV row: {}", row, ex);
            throw ex;
        }
        return transactionCSV;
    }

    private TransactionCSV buildMountainAmericaTransaction(String[] row, SimpleDateFormat sdf)
    {
        TransactionCSV transactionCSV = new TransactionCSV();
        transactionCSV.setTransactionId(row[0]);
        transactionCSV.setTransactionDate(convertDateToLocalDate(row[1], sdf));
        transactionCSV.setEffectiveDate(convertDateToLocalDate(row[2], sdf));
        transactionCSV.setType(row[3]);
        transactionCSV.setTransactionAmount(parseCurrency(row[4]));
        transactionCSV.setDescription(row[7]);
        transactionCSV.setCategory(row[8]);
        transactionCSV.setBalance(parseCurrency(row[10]));
        transactionCSV.setExtendedDescription(row[12]);
        transactionCSV.setMerchantName(getMerchantNameByExtendedDescription(row[12], row[7]));
        transactionCSV.setInstitution_id("Mountain America Credit Union");
        return transactionCSV;
    }

    private LocalDate convertDateToLocalDate(String dateString, SimpleDateFormat formatter)
    {
        log.info("Date String: {}", dateString);
        if(dateString == null || dateString.trim().isEmpty())
        {
            return null;
        }
        try
        {

            String normalizedDate = dateString.replace("-", "/");
            if (normalizedDate.matches("\\d{4}/\\d{2}/\\d{2}")) {
                formatter.applyPattern("yyyy/MM/dd");
            } else if (normalizedDate.matches("\\d{2}/\\d{2}/\\d{4}")) {
                formatter.applyPattern("MM/dd/yyyy");
            }

            Date date = formatter.parse(normalizedDate);
            return date.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
        } catch (ParseException e) {
            log.error("Error parsing date: {}", dateString, e);
            throw new IllegalArgumentException("Error parsing date: " + dateString, e);
        }
    }

    private BigDecimal parseCurrency(String currencyString)
    {
        if(currencyString == null || currencyString.trim().isEmpty())
        {
            return BigDecimal.ZERO;
        }
        String cleaned = currencyString.replaceAll("[$, \\s]", "");
        try
        {
            return new BigDecimal(cleaned);
        }catch(NumberFormatException e){
            log.error("Error parsing currency string: {}", currencyString, e);
            throw new IllegalArgumentException("Error parsing currency string: " + currencyString);
        }
    }

    private Long removeLeadingZeros(String sequenceNumber)
    {
        String sanitized = sequenceNumber.replaceAll("^+0*", "");
        sanitized = sanitized.split("\\.")[0];
        try
        {
            return Long.parseLong(sanitized);
        }catch(NumberFormatException e){
            log.error("Error removing leading zeros from sequence number: {}", sequenceNumber, e);
            throw new IllegalArgumentException("Error removing leading zeros from sequence number: " + sequenceNumber);
        }
    }

    private String getMerchantNameByExtendedDescription(String extendedDescription, String description)
    {
        if(extendedDescription == null || extendedDescription.trim().isEmpty())
        {
            log.info("Extended Description is null or empty");
            return description != null ? description : " ";
        }
        try
        {
            String trimmedExtendedDescription = extendedDescription.trim();
            log.info("Original Merchant Name: {}", trimmedExtendedDescription);
            Locations[] locations = Locations.values();
            for(Locations location : locations)
            {
                String locationValue = location.getValue();
                log.info("Location Value: {}", locationValue);
                String toLowerValue = locationValue.toLowerCase();
                log.info("ToLower Value: {}", toLowerValue);
                if(trimmedExtendedDescription.toLowerCase().contains(locationValue.toLowerCase()))
                {
                    log.info("Merchant Name contains: {}", locationValue);
                    int toUpperIndex = trimmedExtendedDescription.indexOf(toLowerValue);
                    int toUpperLength = toLowerValue.length();
                    trimmedExtendedDescription = trimmedExtendedDescription.substring(0, toUpperIndex + toUpperLength + 1).trim();
                    log.info("Trimmed Merchant Name substring: {}", trimmedExtendedDescription);
                    break;
                }
            }
            return trimmedExtendedDescription;
        }catch(Exception ex){
            log.error("There was an error converting extended description to merchant name", ex);
            throw ex;
        }
    }

    private CsvParserSettings createParserSettings(){
        CsvParserSettings settings = new CsvParserSettings();
        settings.setLineSeparatorDetectionEnabled(true);
        settings.setHeaderExtractionEnabled(false); // We'll handle headers manually
        settings.setIgnoreLeadingWhitespaces(true);
        settings.setIgnoreTrailingWhitespaces(true);
        settings.setSkipEmptyLines(true);
        settings.setNumberOfRowsToSkip(1);
        return settings;
    }

}
