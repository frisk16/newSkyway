package com.example.newSkyWay.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.newSkyWay.entity.Role;

public interface RoleRepository extends JpaRepository<Role, Integer> {
	
}
