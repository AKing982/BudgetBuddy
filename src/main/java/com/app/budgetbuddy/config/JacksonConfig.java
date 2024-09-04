package com.app.budgetbuddy.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
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

//    @Bean
//    public Jackson2ObjectMapperBuilderCustomizer jsonCustomizer(){
//        return builder -> {
//            builder.simpleDateFormat(DATE_TIME_FORMAT);
//            builder.serializers(new LocalDateSerializer(DateTimeFormatter.ofPattern(DATE_FORMAT)));
//            builder.serializers(new LocalDateTimeSerializer(DateTimeFormatter.ofPattern(DATE_TIME_FORMAT)));
//            builder.deserializers(new LocalDateDeserializer(DateTimeFormatter.ofPattern(DATE_FORMAT)));
//            builder.deserializers(new CustomLocalDateDeserializer());
//        };
//    }
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
