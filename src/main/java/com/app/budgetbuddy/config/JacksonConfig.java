package com.app.budgetbuddy.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.*;

import com.fasterxml.jackson.datatype.hibernate5.jakarta.Hibernate5JakartaModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Configuration
public class JacksonConfig
{
    private static final String DATE_FORMAT = "yyyy-MM-dd";
    private static final String DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        Hibernate5JakartaModule hibernate5Module = new Hibernate5JakartaModule();
        hibernate5Module.configure(Hibernate5JakartaModule.Feature.FORCE_LAZY_LOADING, false);
        mapper.registerModule(hibernate5Module);
        mapper.enable(SerializationFeature.WRITE_BIGDECIMAL_AS_PLAIN);
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

//
//    public static class CustomLocalDateDeserializer extends JsonDeserializer<LocalDate> {
//        @Override
//        public LocalDate deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException {
//            JsonNode node = jp.getCodec().readTree(jp);
//            if (node.isObject()) {
//                int year = node.get("year").asInt();
//                int month = node.get("month").asInt();
//                int day = node.get("day").asInt();
//                return LocalDate.of(year, month, day);
//            } else if (node.isTextual()) {
//                String dateString = node.asText();
//                return LocalDate.parse(dateString, DateTimeFormatter.ofPattern(DATE_FORMAT));
//            }
//            throw new IllegalArgumentException("Unable to deserialize LocalDate");
//        }
//    }
}
