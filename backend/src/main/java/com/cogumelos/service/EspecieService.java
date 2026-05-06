package com.cogumelos.service;

import com.cogumelos.repository.EspecieCogumeloRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EspecieService {

    private final EspecieCogumeloRepository repo;

    public EspecieService(EspecieCogumeloRepository repo) {
        this.repo = repo;
    }

    public List<Dtos.EspecieResponse> listar() {
        return repo.findAll().stream().map(Dtos.EspecieResponse::from).toList();
    }
}
