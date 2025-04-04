package com.example.newSkyWay.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.newSkyWay.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {

	public User findByUserName(String userName);
	
}
