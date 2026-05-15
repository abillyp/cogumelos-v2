package com.cogumelos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CogumelosApplication {
    public static void main(String[] args) {
        SpringApplication.run(CogumelosApplication.class, args);
    }
}
