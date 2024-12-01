"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem("IdToken");
		if (token) {
			setUser(jwtDecode(token));
		}
		setLoading(false);
	}, []);

	const login = (jwt) => {
		const body = typeof jwt.body === "string" ? JSON.parse(jwt.body) : jwt.body;

		const { IdToken } = body.authResponse.AuthenticationResult;

		const userObject = jwtDecode(IdToken);

		localStorage.setItem("IdToken", IdToken);

		console.log(userObject);
		setUser(userObject);
	};

	// Logout function
	const logout = () => {
		localStorage.removeItem("IdToken");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	return useContext(AuthContext);
};
