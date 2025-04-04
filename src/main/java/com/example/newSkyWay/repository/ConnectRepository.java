package com.example.newSkyWay.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.newSkyWay.entity.Connect;

public interface ConnectRepository extends JpaRepository<Connect, Integer> {

	public Connect findByMemberId(String memberId);
		
}
