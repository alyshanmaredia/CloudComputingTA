"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Lock, User, Sunrise, Sunset } from "lucide-react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { useAuth } from "../context/authcontext";
import ClipLoader from "react-spinners/ClipLoader";

const mapContainerStyle = {
	width: "100%",
	height: "200px",
};

const center = {
	lat: 24.860966,
	lng: 66.990501,
};

export default function LandingPage() {
	const baseUrl = process.env.NEXT_PUBLIC_AWS_API_GATEWAY_BASE_DEV_URL;
	const router = useRouter();

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const strongPasswordRegex =
		/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;

	const { login } = useAuth();
	const mapRef = useRef(null);

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [mapCenter, setMapCenter] = useState(center);
	const [TabName, setTabName] = useState("signin");

	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginFormError, setLoginFormError] = useState("");

	const [fullname, setFullname] = useState("");
	const [registerEmail, setRegisterEmail] = useState("");
	const [registerPassword, setRegisterPassword] = useState("");
	const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
	const [registerFormError, setRegisterFormError] = useState("");
	const [longitude, setLongitude] = useState(24.860966);
	const [latitude, setLatitude] = useState(66.990501);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");

	const { isLoaded } = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API,
	});

	const onMapClick = useCallback(
		(event) => {
			let lat = event.latLng.lat();
			let lng = event.latLng.lng();

			// Update latitude and longitude state
			setLatitude(lat);
			setLongitude(lng);

			// Update map center
			setMapCenter({ lat, lng });
		},
		[setLatitude, setLongitude, setMapCenter]
	);

	const onMapLoad = useCallback((map) => {
		mapRef.current = map;
	}, []);

	const handleOpenDialog = () => {
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
	};

	const handleCodeSubmit = async () => {
		console.log("confirm");
		try {
			setIsLoading(true);
			const response = await fetch(baseUrl + "/confirm", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: registerEmail,
					code: verificationCode,
				}),
			});

			const data = await response.json();
			console.log(data);
			if (response.ok) {
				OnChangeOfTab("signin");
			} else {
				setLoginFormError(data.message || "User Confirmation failed");
			}
		} catch (err) {
			setError("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
		handleCloseDialog();
	};

	const loginHandler = async (e) => {
		e.preventDefault();
		setLoginFormError(null);

		if (!loginEmail) {
			setLoginFormError("Please enter your email address");
			return;
		}

		if (!emailRegex.test(loginEmail)) {
			setLoginFormError("Email address format is not valid. Try again.");
			return;
		}

		if (!loginPassword) {
			setLoginFormError("Please enter your password");
			return;
		}

		try {
			setIsLoading(true);
			const response = await fetch(baseUrl + "/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: loginEmail,
					password: loginPassword,
				}),
			});

			const data = await response.json();
			console.log(data);

			if (response.ok) {
				console.log("What");
				login(data);
				router.push("/home");
			} else {
				setLoginFormError(data.message || "Login failed");
			}
		} catch (err) {
			setError("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const RegistrationHandler = async (e) => {
		e.preventDefault();

		if (!fullname) {
			setRegisterFormError("Please enter your fullname.");
			return;
		}

		if (registerPassword !== registerConfirmPassword) {
			setRegisterFormError("Password and Confirm Password does not match.");
			return;
		}

		if (!emailRegex.test(registerEmail)) {
			setRegisterFormError("Entered email address is not valid. Try again.");
			return;
		}

		if (!strongPasswordRegex.test(registerPassword)) {
			setRegisterFormError(
				"Entered Password should have 8 characters including special character and a number."
			);
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch(baseUrl + "/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fullname: fullname,
					email: registerEmail,
					username: registerEmail,
					password: registerPassword,
					longitude: longitude,
					latitude: latitude,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setRegisterFormError("");
				handleOpenDialog();
			} else {
				setRegisterFormError(response.data.message);
			}
		} catch (error) {
			console.log(error);
			if (error.response && error.response.data && error.response.data.error) {
				setRegisterFormError(error.response.data.error);
			} else {
				setRegisterFormError("An unknown error occurred.");
			}
			console.error("Registration Error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const OnChangeOfTab = async (v) => {
		setTabName(v);

		if (v === "signin") {
			setLoginEmail("");
			setLoginPassword("");
			setLoginFormError("");
		} else {
			setFullname("");
			setRegisterEmail("");
			setRegisterPassword("");
			setRegisterConfirmPassword("");
			setRegisterFormError("");
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4'>
			<Card className='w-full max-w-md bg-white shadow-lg border-0'>
				<CardHeader className='space-y-1 bg-green-600 text-white rounded-t-lg'>
					<div className='flex items-center justify-center space-x-2'>
						<div className='relative w-10 h-10'>
							<Sunrise className='absolute h-8 w-8 text-yellow-300' />
							<Sunset className='absolute h-6 w-6 text-orange-400 right-0 bottom-0' />
						</div>
						<CardTitle className='text-2xl font-bold'>Namaz Time</CardTitle>
					</div>
				</CardHeader>
				<CardContent className='pt-6'>
					<Tabs
						value={TabName}
						className='w-full'
						onValueChange={OnChangeOfTab}
					>
						<TabsList className='grid w-full grid-cols-2 mb-8 bg-green-100'>
							<TabsTrigger
								value='signin'
								className='data-[state=active]:bg-white'
							>
								Sign In
							</TabsTrigger>
							<TabsTrigger
								value='register'
								className='data-[state=active]:bg-white'
							>
								Register
							</TabsTrigger>
						</TabsList>
						<TabsContent value='signin'>
							<form onSubmit={loginHandler} className='space-y-4'>
								<div className='space-y-2'>
									<Label
										htmlFor='email-signin'
										className='text-sm font-medium text-gray-700'
									>
										Email
									</Label>
									<div className='relative'>
										<Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4' />
										<Input
											id='email-signin'
											placeholder='m@example.com'
											value={loginEmail}
											onChange={(e) => {
												setLoginEmail(e.target.value);
											}}
											required
											className='pl-10 border-green-200 focus:border-green-500 focus:ring-green-500'
										/>
									</div>
								</div>
								<div className='space-y-2'>
									<Label
										htmlFor='password-signin'
										className='text-sm font-medium text-gray-700'
									>
										Password
									</Label>
									<div className='relative'>
										<Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4' />
										<Input
											id='password-signin'
											type='password'
											value={loginPassword}
											onChange={(e) => {
												setLoginPassword(e.target.value);
											}}
											required
											className='pl-10 border-green-200 focus:border-green-500 focus:ring-green-500'
										/>
									</div>
								</div>
								{loginFormError && (
									<div className='text-red-500 text-sm'>{loginFormError}</div>
								)}
								<Button
									type='submit'
									className='w-full bg-green-600 hover:bg-green-700 text-white'
									disabled={isLoading}
								>
									{isLoading ? (
										<ClipLoader size={20} color={"#ffffff"} />
									) : (
										"Sign In"
									)}
								</Button>
							</form>
						</TabsContent>
						<TabsContent value='register'>
							<form onSubmit={RegistrationHandler} className='space-y-4'>
								<div className='space-y-2'>
									<Label
										htmlFor='name-register'
										className='text-sm font-medium text-gray-700'
									>
										Full Name
									</Label>
									<div className='relative'>
										<User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4' />
										<Input
											id='name-register'
											type='text'
											placeholder='John Doe'
											value={fullname}
											onChange={(e) => {
												setFullname(e.target.value);
											}}
											required
											className='pl-10 border-green-200 focus:border-green-500 focus:ring-green-500'
										/>
									</div>
								</div>
								<div className='space-y-2'>
									<Label
										htmlFor='email-register'
										className='text-sm font-medium text-gray-700'
									>
										Email
									</Label>
									<div className='relative'>
										<Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4' />
										<Input
											id='email-register'
											placeholder='m@example.com'
											value={registerEmail}
											onChange={(e) => {
												setRegisterEmail(e.target.value);
											}}
											required
											className='pl-10 border-green-200 focus:border-green-500 focus:ring-green-500'
										/>
									</div>
								</div>
								<div className='space-y-2'>
									<Label
										htmlFor='password-register'
										className='text-sm font-medium text-gray-700'
									>
										Password
									</Label>
									<div className='relative'>
										<Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4' />
										<Input
											id='password-register'
											type='password'
											value={registerPassword}
											onChange={(e) => {
												setRegisterPassword(e.target.value);
											}}
											required
											className='pl-10 border-green-200 focus:border-green-500 focus:ring-green-500'
										/>
									</div>
								</div>
								<div className='space-y-2'>
									<Label
										htmlFor='confirm-password-register'
										className='text-sm font-medium text-gray-700'
									>
										Confirm Password
									</Label>
									<div className='relative'>
										<Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4' />
										<Input
											id='confirm-password-register'
											type='password'
											value={registerConfirmPassword}
											onChange={(e) => {
												setRegisterConfirmPassword(e.target.value);
											}}
											required
											className='pl-10 border-green-200 focus:border-green-500 focus:ring-green-500'
										/>
									</div>
								</div>
								{isLoaded && (
									<div className='h-[200px] w-full rounded-md overflow-hidden'>
										<GoogleMap
											mapContainerStyle={mapContainerStyle}
											center={mapCenter}
											zoom={2}
											onClick={onMapClick}
											onLoad={onMapLoad}
										>
											<MarkerF position={mapCenter} />
										</GoogleMap>
									</div>
								)}
								{registerFormError && (
									<div className='text-red-500 text-sm'>
										{registerFormError}
									</div>
								)}
								<Button
									type='submit'
									className='w-full bg-green-600 hover:bg-green-700 text-white'
									disabled={isLoading}
								>
									{isLoading ? (
										<ClipLoader size={20} color={"#ffffff"} />
									) : (
										"Register"
									)}
								</Button>
							</form>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogTitle>Enter Verification Code</DialogTitle>
					<DialogDescription>
						Please enter the verification code sent to your email.
					</DialogDescription>
					<Input
						type='text'
						placeholder='Enter code'
						value={verificationCode}
						onChange={(e) => setVerificationCode(e.target.value)}
					/>
					<DialogFooter>
						<Button variant='secondary' onClick={handleCloseDialog}>
							Cancel
						</Button>
						<Button variant='primary' onClick={handleCodeSubmit}>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
