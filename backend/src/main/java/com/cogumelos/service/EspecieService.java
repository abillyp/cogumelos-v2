package com.cogumelos.service;

import com.cogumelos.dto.EspecieResponse;
import com.cogumelos.repository.EspecieCogumeloRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EspecieService {

    private final EspecieCogumeloRepository repo;

    public EspecieService(EspecieCogumeloRepository repo) {
        this.repo = repo;
    }

    public List<EspecieResponse> listar() {
        return repo.findAll().stream().map(EspecieResponse::from).toList();
    }
}
